import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildInitial4OptionsPrompt, buildRefinement4OptionsPrompt } from "@/lib/prompt";
import { validateUISchema, UISchema } from "@/lib/ui-schema";
import { validateAndFixLayout } from "@/lib/layout-validation";
import { aestheticIntelligencePass } from "@/lib/aesthetic-validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MODEL = "gemini-3.5-flash-lite";

export const runtime = "nodejs";
export const maxDuration = 90; // longer for 4 options

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(fenceRegex);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  throw new Error("Could not extract JSON");
}

function extractOptionsArray(parsed: unknown): unknown[] {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid");
  const obj = parsed as Record<string, unknown>;

  // Expected { options: [...] }
  if (Array.isArray(obj.options)) return obj.options as unknown[];
  if (Array.isArray(obj.screens)) return obj.screens as unknown[];
  // If array directly
  if (Array.isArray(parsed)) return parsed as unknown[];
  // If { screen: {...}, options... } fallback – wrap single
  if (obj.screen) return [parsed];

  throw new Error("No options array found");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI service not configured. Missing GEMINI_API_KEY. Add it to .env.local and restart the server.",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    const modelName = process.env.AI_MODEL || MODEL;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid request format. Expected multipart/form-data." }, { status: 400 });
    }

    const file = formData.get("image") as unknown as File | null;
    const mode = (formData.get("mode") as string) || "initial"; // initial | refine
    const selectedDesignRaw = formData.get("selectedDesign") as string | null;
    const previousDesignsRaw = formData.get("previousDesigns") as string | null; // optional to avoid repetition

    if (!file) {
      return NextResponse.json({ error: "No sketch selected. Please upload a PNG or JPG." }, { status: 400 });
    }

    const fileType = (file as File).type || "";
    const fileName = (file as File).name || "";

    if (fileType && !ALLOWED_TYPES.includes(fileType) && !fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}. Please upload PNG, JPG or JPEG.`, code: "UNSUPPORTED_TYPE" },
        { status: 400 }
      );
    }

    const lowerName = fileName.toLowerCase();
    const hasValidExt =
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp") ||
      fileType.startsWith("image/");

    if (!hasValidExt) {
      return NextResponse.json({ error: "Unsupported file. Please upload PNG, JPG or JPEG.", code: "UNSUPPORTED_TYPE" }, { status: 400 });
    }

    const size = (file as File).size;
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`, code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    if (size === 0) {
      return NextResponse.json({ error: "Empty file. Please upload a valid sketch image." }, { status: 400 });
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileType || "image/png";

    let selectedDesign: unknown = null;
    if (selectedDesignRaw) {
      try {
        selectedDesign = JSON.parse(selectedDesignRaw);
      } catch {
        selectedDesign = selectedDesignRaw;
      }
    }

    let previousDesigns: unknown = null;
    if (previousDesignsRaw) {
      try {
        previousDesigns = JSON.parse(previousDesignsRaw);
      } catch {
        previousDesigns = previousDesignsRaw;
      }
    }

    // Build prompt based on mode
    let userPrompt: string;
    let temperature = 0.85;

    if (mode === "refine") {
      userPrompt = buildRefinement4OptionsPrompt(selectedDesign);
      temperature = 0.8; // controlled refinement
    } else {
      userPrompt = buildInitial4OptionsPrompt();
      temperature = 0.9; // more distinct initial options
      // If we have previous designs to avoid, append info
      if (previousDesigns) {
        try {
          const prevStr = JSON.stringify(previousDesigns).slice(0, 2000);
          userPrompt += `\n\nAvoid repeating these previous designs (choose different palettes):\n${prevStr}\n`;
        } catch {}
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 55000)
    );

    let content: string;
    try {
      const result = await Promise.race([
        model.generateContent([
          userPrompt,
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ]),
        timeoutPromise,
      ]);

      const response = (result as Awaited<ReturnType<typeof model.generateContent>>).response;
      content = response.text();

      if (!content) {
        return NextResponse.json(
          { error: "AI returned empty response. Try a clearer sketch.", code: "EMPTY_RESPONSE" },
          { status: 502 }
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "TIMEOUT") {
        return NextResponse.json(
          { error: "AI exploration timed out. Please try again with a smaller image.", code: "TIMEOUT" },
          { status: 504 }
        );
      }
      console.error("[explore] Gemini error", e);
      const errStr = String(e);
      if (errStr.includes("API key") || errStr.includes("401") || errStr.includes("403")) {
        return NextResponse.json(
          { error: "AI service authentication failed. Check GEMINI_API_KEY.", code: "AUTH_FAILED" },
          { status: 500 }
        );
      }
      if (errStr.includes("429") || errStr.toLowerCase().includes("quota") || errStr.toLowerCase().includes("rate")) {
        return NextResponse.json(
          { error: "AI service rate limited. Please wait and try again.", code: "RATE_LIMITED" },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "AI exploration failed. Please try again.", code: "AI_FAILED" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch {
      console.error("[explore] JSON extract failed", content.slice(0, 2000));
      return NextResponse.json(
        {
          error: "We couldn't understand this sketch for exploration. Try a clearer image.",
          code: "MALFORMED_AI_RESPONSE",
        },
        { status: 502 }
      );
    }

    let rawOptions: unknown[];
    try {
      rawOptions = extractOptionsArray(parsed);
    } catch {
      console.error("[explore] no options array", JSON.stringify(parsed).slice(0, 2000));
      return NextResponse.json(
        { error: "AI returned invalid exploration format. Please try again.", code: "VALIDATION_FAILED" },
        { status: 502 }
      );
    }

    // Validate each option, keep successful, run aesthetic intelligence + layout fixing
    const validOptions: UISchema[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rawOptions.length; i++) {
      const raw = rawOptions[i];
      try {
        const validation = validateUISchema(raw);
        if (!validation.valid || !validation.data) {
          errors.push(`Option ${i + 1}: ${validation.error}`);
          continue;
        }
        // Aesthetic intelligence pass before layout validation per pipeline:
        // Gemini generation -> design intelligence -> aesthetic intelligence -> layout validation -> collision fixing -> PrototypeRenderer
        const aesthetic = aestheticIntelligencePass(validation.data.screen);
        const fixed = validateAndFixLayout(aesthetic.screen);
        validOptions.push({
          ...validation.data,
          screen: fixed,
        });
      } catch (err) {
        errors.push(`Option ${i + 1}: ${String(err).slice(0, 200)}`);
      }
    }

    // If we got at least 1, return it; if we expected 4 but got less, still return what we have
    if (validOptions.length === 0) {
      return NextResponse.json(
        {
          error: "All exploration options failed validation. Keeping current prototype. Please try again.",
          code: "ALL_OPTIONS_FAILED",
          details: errors.slice(0, 3),
        },
        { status: 502 }
      );
    }

    // If we got less than 4, log but return what we have
    if (validOptions.length < 4) {
      console.warn(`[explore] Only ${validOptions.length} valid options out of ${rawOptions.length}`, errors);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          options: validOptions,
          mode,
          count: validOptions.length,
        },
        model: modelName,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[explore] unexpected", err);
    return NextResponse.json(
      { error: "Something went wrong during exploration. Please try again.", code: "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

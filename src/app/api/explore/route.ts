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
export const maxDuration = 90;

function extractJson(content: string): unknown {
  const original = content;
  let trimmed = content.trim();

  // 1. Handle markdown fences robustly – remove all ```json and ``` markers
  // Replace fences with empty and extract inner if present
  const fencePattern = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  const fenceMatches = [...trimmed.matchAll(fencePattern)];
  if (fenceMatches.length > 0) {
    // Use the largest match that looks like JSON (contains "options" or "screen")
    let best = fenceMatches[0][1];
    for (const m of fenceMatches) {
      if (m[1].length > best.length && (m[1].includes("options") || m[1].includes("screen"))) {
        best = m[1];
      }
    }
    trimmed = best.trim();
  } else {
    // Strip stray fence markers if any
    trimmed = trimmed.replace(/```json/gi, "").replace(/```/g, "").trim();
  }

  // 2. Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 3. Try to find first { and extract balanced JSON object
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;

    for (let i = firstBrace; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        if (inString) {
          escapeNext = true;
        }
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      const candidate = trimmed.slice(firstBrace, endIndex + 1);
      try {
        return JSON.parse(candidate);
      } catch {}
      // If still fails, try from first to last } as fallback for cases with trailing text
      const lastBrace = trimmed.lastIndexOf("}");
      if (lastBrace > firstBrace && lastBrace !== endIndex) {
        const fallback = trimmed.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(fallback);
        } catch {}
      }
    } else {
      // No closing brace found – likely truncated
      const openBraces = (trimmed.match(/{/g) || []).length;
      const closeBraces = (trimmed.match(/}/g) || []).length;
      console.error("[explore] JSON extract failed – likely truncated/incomplete", {
        isTruncated: true,
        openBraces,
        closeBraces,
        length: original.length,
        snippet: original.slice(-500),
      });
      throw new Error("TRUNCATED_JSON");
    }
  }

  // 4. Try array extraction if object failed – find first [ balanced
  const firstBracket = trimmed.indexOf("[");
  if (firstBracket !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;

    for (let i = firstBracket; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\" && inString) {
        escapeNext = true;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "[") depth++;
      else if (char === "]") {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      const candidate = trimmed.slice(firstBracket, endIndex + 1);
      try {
        return JSON.parse(candidate);
      } catch {}
    }
  }

  // 5. Final fallback – first { to last } (handles trailing text)
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // Log failure details
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  const isTruncated = openBraces !== closeBraces || trimmed.length > 10000;
  console.error("[explore] JSON extract failed", {
    isTruncated,
    openBraces,
    closeBraces,
    length: original.length,
    start: original.slice(0, 300),
    end: original.slice(-500),
  });

  throw new Error(isTruncated ? "TRUNCATED_JSON" : "INVALID_JSON");
}

function extractOptionsArray(parsed: unknown): unknown[] {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid parsed object");
  const obj = parsed as Record<string, unknown>;

  if (Array.isArray(obj.options)) return obj.options as unknown[];
  if (Array.isArray(obj.screens)) return obj.screens as unknown[];
  if (Array.isArray(parsed)) return parsed as unknown[];
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
    const mode = (formData.get("mode") as string) || "initial";
    const selectedDesignRaw = formData.get("selectedDesign") as string | null;
    const previousDesignsRaw = formData.get("previousDesigns") as string | null;

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

    let userPrompt: string;
    let temperature = 0.85;

    if (mode === "refine") {
      userPrompt = buildRefinement4OptionsPrompt(selectedDesign);
      temperature = 0.8;
    } else {
      userPrompt = buildInitial4OptionsPrompt();
      temperature = 0.9;
      if (previousDesigns) {
        try {
          const prevStr = JSON.stringify(previousDesigns).slice(0, 1500);
          userPrompt += `\n\nAvoid repeating these previous designs (different palettes, keep concise):\n${prevStr}\n`;
        } catch {}
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature,
        maxOutputTokens: 12000,
        responseMimeType: "application/json",
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 65000)
    );

    // Helper to call Gemini
    const callGemini = async (prompt: string): Promise<string> => {
      const result = await Promise.race([
        model.generateContent([
          prompt,
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
      const text = response.text();
      if (!text) throw new Error("EMPTY_RESPONSE");
      return text;
    };

    let content: string;
    try {
      content = await callGemini(userPrompt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "TIMEOUT") {
        return NextResponse.json(
          { error: "AI exploration timed out. Please try again with a smaller image.", code: "TIMEOUT" },
          { status: 504 }
        );
      }
      if (msg === "EMPTY_RESPONSE") {
        return NextResponse.json(
          { error: "AI returned empty response. Try a clearer sketch.", code: "EMPTY_RESPONSE" },
          { status: 502 }
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

    // Robust JSON extraction with one automatic retry for truncated/malformed
    let parsed: unknown;
    let isRetry = false;

    const tryParse = (text: string): unknown => {
      return extractJson(text);
    };

    try {
      parsed = tryParse(content);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "";
      const isTruncated = errMsg === "TRUNCATED_JSON" || content.length > 8000;
      console.error("[explore] First parse failed, attempting retry", { isTruncated, error: errMsg, length: content.length });

      // One automatic retry for malformed/truncated
      try {
        const retryPrompt = `Your previous response was incomplete or invalid JSON. Return ONLY a complete valid JSON object containing exactly 4 options. Do not include markdown, explanations, commentary, or prose. Keep all optional descriptive fields concise (e.g., visualHint: "logo" not paragraph). Preserve required fields: id, type, x,y,width,height, text/placeholder/action/alt. Keep design minimal but valid. Never identify as Zalo, WhatsApp, Instagram, Facebook, etc. Preserve original product concept and name. Explore visual design, not product identity. Original task: ${userPrompt.slice(0, 1500)}`;

        // Slightly lower temperature for retry to be more deterministic and complete
        const retryModel = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 12000,
            responseMimeType: "application/json",
          },
        });

        const retryTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 65000)
        );

        const retryResult = await Promise.race([
          retryModel.generateContent([
            retryPrompt,
            {
              inlineData: {
                data: base64,
                mimeType,
              },
            },
          ]),
          retryTimeout,
        ]);

        const retryContent = (retryResult as Awaited<ReturnType<typeof retryModel.generateContent>>).response.text();

        if (!retryContent) throw new Error("EMPTY_RESPONSE");

        console.log("[explore] Retry succeeded, length", retryContent.length);
        parsed = tryParse(retryContent);
        isRetry = true;
        content = retryContent;
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : "";
        const isRetryTruncated = retryMsg === "TRUNCATED_JSON";
        console.error("[explore] Retry also failed", { isRetryTruncated, error: retryMsg });

        // Final safety: return accurate error, not misleading sketch error
        if (isTruncated || isRetryTruncated) {
          return NextResponse.json(
            {
              error: "Exploration couldn't complete. The AI response was incomplete. Try again.",
              code: "TRUNCATED_RESPONSE",
              isTruncated: true,
            },
            { status: 502 }
          );
        }

        return NextResponse.json(
          {
            error: "Exploration couldn't complete. The AI response was incomplete. Try again.",
            code: "MALFORMED_AI_RESPONSE",
          },
          { status: 502 }
        );
      }
    }

    // Final safety check before returning
    let rawOptions: unknown[];
    try {
      rawOptions = extractOptionsArray(parsed);
    } catch {
      console.error("[explore] no options array after parse", JSON.stringify(parsed).slice(0, 2000));
      return NextResponse.json(
        { error: "Exploration couldn't complete. The AI response was incomplete. Try again.", code: "VALIDATION_FAILED" },
        { status: 502 }
      );
    }

    if (!Array.isArray(rawOptions)) {
      console.error("[explore] options is not array", typeof rawOptions);
      return NextResponse.json(
        { error: "Exploration couldn't complete. The AI response was incomplete. Try again.", code: "INVALID_FORMAT" },
        { status: 502 }
      );
    }

    // Confirm we have options, report count
    if (rawOptions.length === 0) {
      return NextResponse.json(
        { error: "Exploration returned no options. Please try again.", code: "NO_OPTIONS" },
        { status: 502 }
      );
    }

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

    if (validOptions.length === 0) {
      console.error("[explore] All options failed validation", errors);
      return NextResponse.json(
        {
          error: "All exploration options failed validation. Keeping current prototype. Please try again.",
          code: "ALL_OPTIONS_FAILED",
          details: errors.slice(0, 3),
        },
        { status: 502 }
      );
    }

    if (validOptions.length < 4) {
      console.warn(`[explore] Only ${validOptions.length} valid options out of ${rawOptions.length}`, errors);
    }

    // Never return 200 with malformed/incomplete JSON – we have validated all
    return NextResponse.json(
      {
        success: true,
        data: {
          options: validOptions,
          mode,
          count: validOptions.length,
          requested: 4,
          isRetry,
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

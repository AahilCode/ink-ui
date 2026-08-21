import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, USER_INSTRUCTION } from "@/lib/prompt";
import { validateUISchema } from "@/lib/ui-schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// Free-tier vision-capable Gemini model for hackathon demo – updated to 3.5 per API deprecation notice
const MODEL = "gemini-3.5-flash-lite";

export const runtime = "nodejs";
export const maxDuration = 60;

function extractJson(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(fenceRegex);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      // continue
    }
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // continue
    }
  }

  throw new Error("Could not extract JSON from AI response");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI service not configured. Missing GEMINI_API_KEY. Add it to .env.local and restart the server.",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    // Allow override via env for flexibility, but default is gemini-3.5-flash-lite
    const modelName = process.env.AI_MODEL || MODEL;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const file = formData.get("image") as unknown as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No sketch selected. Please upload a PNG or JPG." },
        { status: 400 }
      );
    }

    const fileType = (file as File).type || "";
    const fileName = (file as File).name || "";

    if (fileType && !ALLOWED_TYPES.includes(fileType)) {
      if (!fileType.startsWith("image/")) {
        return NextResponse.json(
          {
            error: `Unsupported file type: ${fileType}. Please upload PNG, JPG or JPEG.`,
            code: "UNSUPPORTED_TYPE",
          },
          { status: 400 }
        );
      }
    }

    const lowerName = fileName.toLowerCase();
    const hasValidExt =
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp") ||
      fileType.startsWith("image/");

    if (!hasValidExt) {
      return NextResponse.json(
        { error: "Unsupported file. Please upload PNG, JPG or JPEG.", code: "UNSUPPORTED_TYPE" },
        { status: 400 }
      );
    }

    const size = (file as File).size;
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${(size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    if (size === 0) {
      return NextResponse.json(
        { error: "Empty file. Please upload a valid sketch image." },
        { status: 400 }
      );
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileType || "image/png";

    // Gemini integration – image as inlineData, not text conversion
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    });

    // Timeout handling – race with 28s timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 28000)
    );

    let content: string;
    try {
      const result = await Promise.race([
        model.generateContent([
          USER_INSTRUCTION,
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ]),
        timeoutPromise,
      ]);

      // result is GenerateContentResult
      const response = (result as Awaited<ReturnType<typeof model.generateContent>>).response;
      content = response.text();

      if (!content) {
        return NextResponse.json(
          {
            error: "AI returned empty response. Try a clearer sketch with darker lines.",
            code: "EMPTY_RESPONSE",
          },
          { status: 502 }
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "TIMEOUT") {
        return NextResponse.json(
          { error: "AI analysis timed out. Please try again with a smaller image.", code: "TIMEOUT" },
          { status: 504 }
        );
      }
      console.error("[analyze] Gemini fetch/generation error", e);
      const errStr = String(e);
      if (errStr.includes("API key") || errStr.includes("API_KEY") || errStr.includes("401") || errStr.includes("403")) {
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
      return NextResponse.json(
        { error: "AI analysis failed. Please try again.", code: "AI_FAILED" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch {
      console.error("[analyze] JSON extract failed", content.slice(0, 1000));
      return NextResponse.json(
        {
          error:
            "We couldn't understand this sketch. Try a clearer image with darker lines and visible components.",
          code: "MALFORMED_AI_RESPONSE",
        },
        { status: 502 }
      );
    }

    const validation = validateUISchema(parsed);
    if (!validation.valid || !validation.data) {
      console.error("[analyze] validation failed", validation.error, JSON.stringify(parsed).slice(0, 1000));
      return NextResponse.json(
        {
          error: validation.error?.includes("No components")
            ? "We couldn't detect any UI components. Try a clearer sketch with boxes, buttons, and text."
            : `AI returned invalid format: ${validation.error}`,
          code: "VALIDATION_FAILED",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: validation.data,
        model: modelName,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[analyze] unexpected", err);
    return NextResponse.json(
      {
        error: "Something went wrong during analysis. Please try again.",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

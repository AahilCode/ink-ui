import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, USER_INSTRUCTION } from "@/lib/prompt";
import { validateUISchema } from "@/lib/ui-schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// Vision-capable model via OpenRouter – gpt-4o-mini supports images and JSON mode
const MODEL_FALLBACK = "openai/gpt-4o-mini";

export const runtime = "nodejs"; // Need Buffer and more memory
export const maxDuration = 60; // Vercel max

function extractJson(content: string): unknown {
  const trimmed = content.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // Try stripping markdown code fences
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(fenceRegex);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      // continue
    }
  }

  // Try find first { ... last } 
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
    // Check API key – OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI service not configured. Missing OPENROUTER_API_KEY. Add it to .env.local and restart the server.",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    const model = process.env.AI_MODEL || MODEL_FALLBACK;

    // Parse formData
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid request format. Expected multipart/form-data." }, { status: 400 });
    }

    const file = formData.get("image") as unknown as File | null;

    if (!file) {
      return NextResponse.json({ error: "No sketch selected. Please upload a PNG or JPG." }, { status: 400 });
    }

    // Validate file type
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

    // Validate size
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
      return NextResponse.json({ error: "Empty file. Please upload a valid sketch image." }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await (file as File).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = fileType || "image/png";
    const dataUrl = `data:${mime};base64,${base64}`;

    // Call OpenRouter (OpenAI-compatible)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // Optional headers for OpenRouter ranking – safe to include if site env is set
          ...(process.env.OPENROUTER_SITE_URL
            ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
            : {}),
          ...(process.env.OPENROUTER_APP_NAME
            ? { "X-Title": process.env.OPENROUTER_APP_NAME }
            : { "X-Title": "INK UI" }),
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: USER_INSTRUCTION,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (e: unknown) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      if (isAbort) {
        return NextResponse.json(
          { error: "AI analysis timed out. Please try again with a smaller image.", code: "TIMEOUT" },
          { status: 504 }
        );
      }
      console.error("[analyze] fetch error", e);
      return NextResponse.json(
        { error: "Network error while contacting AI service. Please try again.", code: "NETWORK_ERROR" },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      const text = await aiResponse.text().catch(() => "");
      console.error("[analyze] OpenRouter error", aiResponse.status, text.slice(0, 500));
      if (aiResponse.status === 401) {
        return NextResponse.json(
          { error: "AI service authentication failed. Check OPENROUTER_API_KEY.", code: "AUTH_FAILED" },
          { status: 500 }
        );
      }
      if (aiResponse.status === 429) {
        return NextResponse.json(
          { error: "AI service rate limited. Please wait and try again.", code: "RATE_LIMITED" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "AI analysis failed. Please try again.", code: "AI_FAILED", details: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const json = (await aiResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "AI returned empty response. Try a clearer sketch with darker lines.", code: "EMPTY_RESPONSE" },
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
        model,
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

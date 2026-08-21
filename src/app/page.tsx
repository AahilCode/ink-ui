"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { SketchPanel } from "@/components/workspace/sketch-panel";
import { PrototypePanel } from "@/components/workspace/prototype-panel";
import { AnalyzeButton } from "@/components/workspace/analyze-button";
import { HowItWorks } from "@/components/how-it-works";
import type { UISchema } from "@/lib/ui-schema";

type AnalysisStatus = "idle" | "analyzing" | "success" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<UISchema | null>(null);
  const [progressMessage, setProgressMessage] = useState("Reading your sketch...");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    (f: File) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(f);
      setFile(f);
      setPreviewUrl(url);
      setError(null);
      setStatus("idle");
      setResult(null);
    },
    [previewUrl]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setStatus("idle");
    setResult(null);
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError("No sketch selected. Please upload a PNG or JPG.");
      return;
    }

    setStatus("analyzing");
    setError(null);
    setResult(null);

    const messages = [
      "Reading your sketch...",
      "Identifying UI components...",
      "Understanding layout...",
      "Structuring JSON...",
    ];
    let idx = 0;
    setProgressMessage(messages[0]);

    const interval = setInterval(() => {
      idx = Math.min(idx + 1, messages.length - 1);
      setProgressMessage(messages[idx]);
    }, 1800);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "AI analysis failed. Please try again.");
      }

      if (!json?.data) {
        throw new Error("Invalid response from server.");
      }

      setResult(json.data as UISchema);
      setStatus("success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("error");
    } finally {
      clearInterval(interval);
    }
  }, [file]);

  const hasImage = !!file && !!previewUrl;
  const isAnalyzing = status === "analyzing";

  return (
    <div className="flex min-h-screen flex-col bg-[#1c1c1c]">
      <Header />

      {/* Hero / Intro */}
      <div className="relative border-b border-[#2a2a2a]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-40%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(111,44,62,0.14),transparent_70%)] blur-[1px]" />
          <div className="absolute right-[-10%] top-[-30%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(111,44,62,0.08),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(28,28,28,0.6)_80%,#1c1c1c_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 py-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[720px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] bg-[#242424] px-3 py-1 backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#6f2c3e]/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#6f2c3e]" />
                  </span>
                  <span className="text-[11px] font-medium tracking-[0.14em] text-[#f5f5f3]/70">WORKSPACE v0.4 • CAMERA LIVE</span>
                </div>
                <span className="text-[11px] tracking-wide text-[#a8a8a3]/60">Upload → AI → Prototype</span>
              </div>

              <h1 className="text-pretty text-[34px] sm:text-[52px] font-[620] leading-[0.95] tracking-[-0.03em] text-[#f5f5f3]">
                INK UI
                <br />
                <span className="bg-gradient-to-b from-[#f5f5f3] to-[#a8a8a3] bg-clip-text text-transparent">
                  From sketch to interactive.
                </span>
              </h1>

              <p className="mt-4 max-w-[520px] text-pretty text-[15px] sm:text-[17px] leading-[1.6] tracking-[-0.01em] text-[#a8a8a3]">
                Turn a hand-drawn interface into a working prototype.
                <span className="text-[#a8a8a3]/60"> Photograph your sketch, let AI understand it, and get a live UI.</span>
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#2e2e2e] bg-[#242424] px-3 py-1.5">
                <kbd className="rounded bg-[#2e2e2e] px-1.5 py-0.5 font-mono text-[10px] text-[#a8a8a3]">⌘</kbd>
                <kbd className="rounded bg-[#2e2e2e] px-1.5 py-0.5 font-mono text-[10px] text-[#a8a8a3]">U</kbd>
                <span className="ml-1 text-[11px] text-[#a8a8a3]/70">Upload</span>
              </div>
              <div className="text-right text-[11px] leading-[1.4] text-[#a8a8a3]/40">
                <div>Hackathon demo • Gemini 3.5 Flash Lite</div>
                <div>Theme: #1c1c1c + #6f2c3e</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 sm:px-6 md:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <SketchPanel
            previewUrl={previewUrl}
            fileName={file?.name || null}
            fileSize={file?.size || null}
            error={error}
            isAnalyzing={isAnalyzing}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
          />
          <PrototypePanel status={status} result={result} error={error} progressMessage={progressMessage} />
        </div>

        <AnalyzeButton disabled={!hasImage || isAnalyzing} isAnalyzing={isAnalyzing} hasImage={hasImage} onClick={handleAnalyze} />

        {error && status !== "error" && (
          <div className="mx-auto mt-2 max-w-[520px] rounded-[12px] border border-[#6f2c3e]/30 bg-[#6f2c3e]/15 px-4 py-3 text-center text-[12px] text-[#f5f5f3]">
            {error}
          </div>
        )}
      </main>

      <HowItWorks />

      <footer id="about" className="border-t border-[#2a2a2a] py-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-[7px] bg-[#6f2c3e] text-[#f5f5f3] flex items-center justify-center text-[10px] font-bold">INK</div>
            <span className="text-[12.5px] tracking-[-0.01em] text-[#a8a8a3]/70">
              INK UI • © {new Date().getFullYear()} • #1c1c1c + #6f2c3e • Gemini 3.5 Flash Lite
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#a8a8a3]/40">
            <span className="hidden sm:inline">Image in memory only</span>
            <span className="hidden sm:inline">•</span>
            <span>API: POST /api/analyze</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

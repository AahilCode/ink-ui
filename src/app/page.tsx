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

  // Cleanup object URL on unmount / change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    (f: File) => {
      // Revoke previous url
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
    <div className="flex min-h-screen flex-col bg-[#08080A]">
      <Header />

      {/* Hero / Intro */}
      <div className="relative border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-40%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.06),transparent_70%)] blur-[1px]" />
          <div className="absolute right-[-10%] top-[-30%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(8,8,10,0.6)_80%,#08080A_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 py-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[720px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-white/40" />
                    <span className="relative inline-flex size-2 rounded-full bg-white" />
                  </span>
                  <span className="text-[11px] font-medium tracking-[0.14em] text-white/70">WORKSPACE v0.2 • AI LIVE</span>
                </div>
                <span className="text-[11px] tracking-wide text-white/25">Upload → AI → JSON</span>
              </div>

              <h1 className="text-pretty text-[34px] sm:text-[52px] font-[620] leading-[0.95] tracking-[-0.03em] text-white">
                INK UI
                <br />
                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  From sketch to interactive.
                </span>
              </h1>

              <p className="mt-4 max-w-[520px] text-pretty text-[15px] sm:text-[17px] leading-[1.6] tracking-[-0.01em] text-white/50">
                Turn a hand-drawn interface into a working prototype.
                <span className="text-white/25"> Photograph your sketch, let AI understand it, and get a live UI.</span>
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#111113] px-3 py-1.5">
                <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-white/60">⌘</kbd>
                <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-white/60">U</kbd>
                <span className="ml-1 text-[11px] text-white/30">Upload</span>
              </div>
              <div className="text-right text-[11px] leading-[1.4] text-white/20">
                <div>Step 2 • Upload + AI analysis + validated JSON</div>
                <div>Renderer coming in Step 3</div>
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

        {/* Inline error display for mobile if needed */}
        {error && status !== "error" && (
          <div className="mx-auto mt-2 max-w-[520px] rounded-[12px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-[12px] text-red-200">
            {error}
          </div>
        )}
      </main>

      <HowItWorks />

      <footer id="about" className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-[7px] bg-white text-black flex items-center justify-center text-[10px] font-bold">INK</div>
            <span className="text-[12.5px] tracking-[-0.01em] text-white/40">
              INK UI • © {new Date().getFullYear()} • Step 2: Upload + AI analysis
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-white/25">
            <span className="hidden sm:inline">Image in memory only</span>
            <span className="hidden sm:inline">•</span>
            <span>API: POST /api/analyze</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

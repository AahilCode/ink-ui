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
  const [previousResult, setPreviousResult] = useState<UISchema | null>(null);
  const [progressMessage, setProgressMessage] = useState("Reading your sketch...");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Multi-option exploration state
  const [activeOptions, setActiveOptions] = useState<UISchema[] | null>(null);
  const [activeOptionsMode, setActiveOptionsMode] = useState<"initial" | "refine" | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isExploringOptions, setIsExploringOptions] = useState(false);
  const [explorationError, setExplorationError] = useState<string | null>(null);
  const [explorationCount, setExplorationCount] = useState(0);

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
      setRegenError(null);
      setExplorationError(null);
      setStatus("idle");
      setResult(null);
      setPreviousResult(null);
      setRegenerationCount(0);
      setActiveOptions(null);
      setActiveOptionsMode(null);
      setSelectedOptionIndex(0);
      setExplorationCount(0);
    },
    [previewUrl]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setRegenError(null);
    setExplorationError(null);
    setStatus("idle");
    setResult(null);
    setPreviousResult(null);
    setRegenerationCount(0);
    setActiveOptions(null);
    setActiveOptionsMode(null);
    setSelectedOptionIndex(0);
    setExplorationCount(0);
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError("No sketch selected. Please upload a PNG or JPG.");
      return;
    }

    setStatus("analyzing");
    setError(null);
    setRegenError(null);
    setExplorationError(null);
    setResult(null);
    setPreviousResult(null);
    setRegenerationCount(0);
    setActiveOptions(null);
    setActiveOptionsMode(null);
    setSelectedOptionIndex(0);
    setExplorationCount(0);

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

  const handleRegenerate = useCallback(async () => {
    if (!file) {
      setError("No sketch available for regeneration. Please upload again.");
      return;
    }
    if (!result) {
      setError("No prototype to regenerate. Analyze a sketch first.");
      return;
    }

    setIsRegenerating(true);
    setRegenError(null);
    setProgressMessage("Regenerating design...");

    const nextCount = regenerationCount + 1;

    const regenMessages = [
      "Reimagining color palette...",
      "Exploring new typography...",
      "Rethinking spacing & composition...",
      "Crafting fresh visual assets...",
    ];
    let idx = 0;
    setProgressMessage(regenMessages[0]);
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, regenMessages.length - 1);
      setProgressMessage(regenMessages[idx]);
    }, 1600);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("isRegeneration", "true");
      form.append("previousDesign", JSON.stringify(result));
      form.append("regenerationCount", String(nextCount));

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Regeneration failed. Please try again.");
      }

      if (!json?.data) {
        throw new Error("Invalid regeneration response.");
      }

      setPreviousResult(result);
      setResult(json.data as UISchema);
      setRegenerationCount(nextCount);
      setStatus("success");
      // Clear options when single regenerate happens – keep single mode
      setActiveOptions(null);
      setActiveOptionsMode(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Regeneration failed. Please try again.";
      setRegenError(message);
    } finally {
      clearInterval(interval);
      setIsRegenerating(false);
      setProgressMessage("Reading your sketch...");
    }
  }, [file, result, regenerationCount]);

  const handleUndo = useCallback(() => {
    if (!previousResult) return;
    const current = result;
    setResult(previousResult);
    setPreviousResult(current);
    setRegenError(null);
    setExplorationError(null);
    setRegenerationCount((c) => Math.max(0, c - 1));
  }, [previousResult, result]);

  // --- Multi-option exploration handlers ---

  const handleExploreInitial = useCallback(async () => {
    if (!file) {
      setError("No sketch available. Upload a sketch first.");
      return;
    }

    setIsExploringOptions(true);
    setExplorationError(null);
    setRegenError(null);
    setProgressMessage("Exploring designs...");

    const exploreMessages = [
      "Exploring designs...",
      "Generating 4 directions...",
      "Polishing variations...",
      "Validating layouts...",
    ];
    let idx = 0;
    setProgressMessage(exploreMessages[0]);
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, exploreMessages.length - 1);
      setProgressMessage(exploreMessages[idx]);
    }, 1500);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("mode", "initial");
      // Pass previous designs to avoid repetition if we already have options
      if (activeOptions) {
        form.append("previousDesigns", JSON.stringify(activeOptions));
      } else if (result) {
        form.append("previousDesigns", JSON.stringify([result]));
      }

      const res = await fetch("/api/explore", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Exploration failed. Please try again.");
      }

      const options = json?.data?.options as UISchema[] | undefined;
      if (!options || options.length === 0) {
        throw new Error("No design options returned.");
      }

      // Keep successful options even if less than 4 – API already handles partial
      setActiveOptions(options);
      setActiveOptionsMode("initial");
      setSelectedOptionIndex(0);
      setPreviousResult(result); // save current for undo
      setResult(options[0]);
      setStatus("success");
      setExplorationCount((c) => c + 1);
      setProgressMessage("4 design directions generated");
      setTimeout(() => setProgressMessage("Reading your sketch..."), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Exploration failed. Please try again.";
      setExplorationError(msg);
      // Keep currently selected prototype per spec
    } finally {
      clearInterval(interval);
      setIsExploringOptions(false);
    }
  }, [file, activeOptions, result]);

  const handleExploreRefine = useCallback(async () => {
    if (!file) {
      setError("No sketch available. Upload a sketch first.");
      return;
    }

    const sourceDesign = activeOptions ? activeOptions[selectedOptionIndex] : result;

    if (!sourceDesign) {
      setError("No design selected to refine. Generate options first.");
      return;
    }

    setIsExploringOptions(true);
    setExplorationError(null);
    setRegenError(null);
    setProgressMessage("Exploring this design...");

    const refineMessages = [
      "Exploring this design...",
      "Refining spacing & hierarchy...",
      "Polishing cards & assets...",
      "Generating refinements...",
    ];
    let idx = 0;
    setProgressMessage(refineMessages[0]);
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, refineMessages.length - 1);
      setProgressMessage(refineMessages[idx]);
    }, 1500);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("mode", "refine");
      form.append("selectedDesign", JSON.stringify(sourceDesign));

      const res = await fetch("/api/explore", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Refinement failed. Please try again.");
      }

      const options = json?.data?.options as UISchema[] | undefined;
      if (!options || options.length === 0) {
        throw new Error("No refinements returned.");
      }

      setActiveOptions(options);
      setActiveOptionsMode("refine");
      setSelectedOptionIndex(0);
      setPreviousResult(result);
      setResult(options[0]);
      setStatus("success");
      setExplorationCount((c) => c + 1);
      setProgressMessage("4 refinements generated");
      setTimeout(() => setProgressMessage("Reading your sketch..."), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Refinement failed. Please try again.";
      setExplorationError(msg);
    } finally {
      clearInterval(interval);
      setIsExploringOptions(false);
    }
  }, [file, activeOptions, selectedOptionIndex, result]);

  const handleSelectOptionIndex = useCallback(
    (index: number) => {
      if (!activeOptions) return;
      if (index < 0 || index >= activeOptions.length) return;
      setSelectedOptionIndex(index);
      // Smoothly replace old prototype without API call per spec
      setResult(activeOptions[index]);
      setStatus("success");
    },
    [activeOptions]
  );

  const handleUseDesign = useCallback(() => {
    if (!activeOptions) return;
    const selected = activeOptions[selectedOptionIndex];
    if (!selected) return;
    // Make it CURRENT DESIGN – becomes new source for refinement
    setPreviousResult(result);
    setResult(selected);
    setStatus("success");
    // Keep options for navigation, but clear refine/initial distinction? Keep as is for continued exploring
    setExplorationError(null);
  }, [activeOptions, selectedOptionIndex, result]);

  const hasImage = !!file && !!previewUrl;
  const isAnalyzing = status === "analyzing";
  const showRegenerating = isRegenerating || isExploringOptions;
  const combinedError = explorationError || regenError || error;

  return (
    <div className="flex min-h-screen flex-col bg-[#13111e]">
      <Header />

      <div className="relative border-b border-[#3E3E75]/30">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-40%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(78,31,110,0.22),transparent_70%)] blur-[1px]" />
          <div className="absolute right-[-5%] top-[-30%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(69,169,169,0.14),transparent_70%)]" />
          <div className="absolute left-[30%] top-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(152,232,222,0.06),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(19,17,30,0.6)_80%,#13111e_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 py-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[720px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#3E3E75]/40 bg-[#1d1b2a] px-3 py-1 backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#45A9A9]/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#45A9A9]" />
                  </span>
                  <span className="text-[11px] font-medium tracking-[0.14em] text-[#f0eef6]/80">
                    WORKSPACE • 4 OPTIONS • GEMINI 3.5
                  </span>
                </div>
                <span className="text-[11px] tracking-wide text-[#a8a6b8]/60">Sketch → 4 Options → Refine</span>
              </div>

              <h1 className="text-pretty text-[34px] sm:text-[52px] font-[650] leading-[0.95] tracking-[-0.03em] text-[#f0eef6]">
                INK UI
                <br />
                <span className="bg-gradient-to-r from-[#4E1F6E] via-[#45A9A9] to-[#98E8DE] bg-clip-text text-transparent">
                  From sketch to interactive.
                </span>
              </h1>

              <p className="mt-4 max-w-[520px] text-pretty text-[15px] sm:text-[17px] leading-[1.6] tracking-[-0.01em] text-[#a8a6b8]">
                Turn a hand-drawn interface into a working prototype.
                <span className="text-[#a8a6b8]/60"> Generate 4 directions, pick one, refine into 4 more.</span>
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#3E3E75]/30 bg-[#1d1b2a] px-3 py-1.5">
                <kbd className="rounded bg-[#2d2b42] px-1.5 py-0.5 font-mono text-[10px] text-[#98E8DE]">⌘</kbd>
                <kbd className="rounded bg-[#2d2b42] px-1.5 py-0.5 font-mono text-[10px] text-[#98E8DE]">E</kbd>
                <span className="ml-1 text-[11px] text-[#a8a6b8]/70">Explore 4</span>
              </div>
              <div className="text-right text-[11px] leading-[1.4] text-[#a8a6b8]/40">
                <div>Multi-option • Design Tree • Free</div>
                <div>Original sketch reused • No re-upload</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 sm:px-6 md:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <SketchPanel
            previewUrl={previewUrl}
            fileName={file?.name || null}
            fileSize={file?.size || null}
            error={error}
            isAnalyzing={isAnalyzing || isRegenerating || isExploringOptions}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
          />
          <PrototypePanel
            status={status}
            result={result}
            previousResult={previousResult}
            error={error}
            progressMessage={progressMessage}
            isRegenerating={showRegenerating}
            regenerationCount={regenerationCount}
            regenError={regenError}
            onRegenerate={handleRegenerate}
            onUndo={handleUndo}
            // New multi-option props
            options={activeOptions}
            selectedOptionIndex={selectedOptionIndex}
            onSelectOptionIndex={handleSelectOptionIndex}
            onUseDesign={handleUseDesign}
            onExploreDesign={handleExploreRefine}
            isExploringOptions={isExploringOptions}
            activeOptionsMode={activeOptionsMode}
            explorationCount={explorationCount}
            explorationError={explorationError}
            onExploreInitial={handleExploreInitial}
          />
        </div>

        <AnalyzeButton disabled={!hasImage || isAnalyzing || isRegenerating || isExploringOptions} isAnalyzing={isAnalyzing} hasImage={hasImage} onClick={handleAnalyze} />

        {combinedError && status !== "error" ? (
          <div className="mx-auto mt-2 max-w-[520px] rounded-[12px] border border-[#4E1F6E]/30 bg-[#4E1F6E]/15 px-4 py-3 text-center text-[12px] text-[#f0eef6]">
            {combinedError}
          </div>
        ) : null}
      </main>

      <HowItWorks />

      <footer id="about" className="border-t border-[#3E3E75]/30 py-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-[7px] bg-gradient-to-br from-[#4E1F6E] to-[#45A9A9] text-[#f0eef6] flex items-center justify-center text-[10px] font-bold">INK</div>
            <span className="text-[12.5px] tracking-[-0.01em] text-[#a8a6b8]/70">
              INK UI • © {new Date().getFullYear()} • 4 Options • Gemini 3.5
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#a8a6b8]/40">
            <span className="hidden sm:inline">Design tree: sketch → 4 → refine</span>
            <span className="hidden sm:inline">•</span>
            <span>API: /api/analyze + /api/explore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

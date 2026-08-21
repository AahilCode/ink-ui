"use client";
import React, { useState } from "react";
import type { UISchema } from "@/lib/ui-schema";
import { PrototypeRenderer } from "@/components/prototype/PrototypeRenderer";

type AnalysisStatus = "idle" | "analyzing" | "success" | "error";
type ViewMode = "desktop" | "mobile";

type Props = {
  status: AnalysisStatus;
  result: UISchema | null;
  error: string | null;
  progressMessage: string;
};

export function PrototypePanel({ status, result, error, progressMessage }: Props) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [resetKey, setResetKey] = useState(0);

  const componentCount = result?.screen.components.length ?? 0;

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResetKey((k) => k + 1);
  };

  return (
    <div className="group/panel relative flex min-h-[520px] lg:min-h-[560px] flex-col overflow-hidden rounded-[24px] border border-[#2a2a2a] bg-[#242424] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex h-[48px] items-center justify-between border-b border-[#2a2a2a] px-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#a8a8a3]">
            Interactive Prototype
          </span>
          <div className="hidden items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#2a2a2a] px-2.5 py-1 sm:flex">
            {status === "idle" && (
              <>
                <div className="size-1.5 rounded-full bg-[#a8a8a3]/40" />
                <span className="text-[10px] font-medium tracking-wide text-[#a8a8a3]/60">Awaiting input</span>
              </>
            )}
            {status === "analyzing" && (
              <>
                <div className="size-1.5 animate-pulse rounded-full bg-[#6f2c3e]" />
                <span className="text-[10px] font-medium tracking-wide text-[#f5f5f3]/70">Analyzing</span>
              </>
            )}
            {status === "success" && (
              <>
                <div className="size-1.5 rounded-full bg-[#6f2c3e] shadow-[0_0_8px_rgba(111,44,62,0.5)]" />
                <span className="text-[10px] font-medium tracking-wide text-[#f5f5f3]/70">Ready • {componentCount}</span>
              </>
            )}
            {status === "error" && (
              <>
                <div className="size-1.5 rounded-full bg-[#6f2c3e]" />
                <span className="text-[10px] font-medium tracking-wide text-[#f5f5f3]/60">Error</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] tracking-wide text-[#a8a8a3]/40 sm:inline">Preview</span>
          <div className="flex items-center gap-1 rounded-full border border-[#2e2e2e] bg-[#1c1c1c] p-1">
            <div className="size-1.5 rounded-full bg-[#6f2c3e]/60" />
            <div className="size-1.5 rounded-full bg-[#6f2c3e]/40" />
            <div className="size-1.5 rounded-full bg-[#6f2c3e]/30" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2">
        <div className="flex items-center gap-1 rounded-full border border-[#2e2e2e] bg-[#242424] p-1">
          <button
            onClick={() => setViewMode("desktop")}
            className={`rounded-full px-3 py-1 text-[11px] font-[500] tracking-wide transition-all ${
              viewMode === "desktop"
                ? "bg-[#6f2c3e] text-[#f5f5f3] shadow-sm"
                : "text-[#a8a8a3] hover:text-[#f5f5f3]"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`rounded-full px-3 py-1 text-[11px] font-[500] tracking-wide transition-all ${
              viewMode === "mobile"
                ? "bg-[#6f2c3e] text-[#f5f5f3] shadow-sm"
                : "text-[#a8a8a3] hover:text-[#f5f5f3]"
            }`}
          >
            Mobile
          </button>
        </div>

        <div className="flex items-center gap-2">
          {status === "success" && (
            <>
              <button
                onClick={() => setShowJson(!showJson)}
                className="rounded-full border border-[#2e2e2e] bg-[#2a2a2a] px-2.5 py-1 text-[11px] font-medium text-[#a8a8a3] hover:text-[#f5f5f3] hover:bg-[#2e2e2e]"
              >
                {showJson ? "Hide JSON" : "View JSON"}
              </button>
              <button
                onClick={handleCopy}
                className="hidden sm:inline-flex rounded-full border border-[#2e2e2e] bg-[#2a2a2a] px-2.5 py-1 text-[11px] font-medium text-[#a8a8a3] hover:text-[#f5f5f3]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
          <button
            onClick={handleReset}
            disabled={status !== "success"}
            className="rounded-full border border-[#6f2c3e]/30 bg-[#6f2c3e]/15 px-3 py-1 text-[11px] font-[500] text-[#f5f5f3]/80 hover:text-[#f5f5f3] hover:bg-[#6f2c3e]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col bg-[#1c1c1c] p-3 sm:p-3.5">
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[#2a2a2a] bg-[#242424]">
          {status !== "success" && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(111,44,62,0.12),transparent_60%)]" />
              <div className="absolute inset-0 opacity-30 dots-pattern" />
            </div>
          )}

          {/* IDLE */}
          {status === "idle" && (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 opacity-[0.35]">
                <div className="w-full max-w-[360px] overflow-hidden rounded-[12px] border border-[#2e2e2e] bg-[#1c1c1c] shadow-2xl">
                  <div className="flex h-9 items-center gap-2 border-b border-[#2a2a2a] bg-[#242424] px-3">
                    <div className="flex gap-1.5">
                      <div className="size-2.5 rounded-full bg-[#2e2e2e]" />
                      <div className="size-2.5 rounded-full bg-[#2e2e2e]" />
                      <div className="size-2.5 rounded-full bg-[#2e2e2e]" />
                    </div>
                    <div className="ml-3 h-5 flex-1 rounded-full bg-[#2a2a2a]" />
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-full bg-[#2a2a2a]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded-full bg-[#2e2e2e]" />
                        <div className="h-2 w-1/2 rounded-full bg-[#2a2a2a]" />
                      </div>
                    </div>
                    <div className="h-24 rounded-[10px] border border-[#2a2a2a] bg-[#242424]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 rounded-[10px] bg-[#2a2a2a]" />
                      <div className="h-16 rounded-[10px] bg-[#2a2a2a]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
                <div className="flex w-full max-w-[300px] flex-col items-center rounded-[16px] border border-[#2e2e2e] bg-[#1c1c1c]/90 px-6 py-7 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-[12px] bg-[#6f2c3e] text-[#f5f5f3] shadow-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <path d="M8 12H16M12 8V16" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-[550] tracking-[-0.01em] text-[#f5f5f3]">Your prototype will appear here</h3>
                  <p className="mt-1.5 text-center text-[12.5px] leading-[1.5] text-[#a8a8a3]">
                    Upload a sketch and run analysis to generate a live, editable interface.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2 rounded-full border border-[#2e2e2e] bg-[#242424] px-3 py-1.5">
                  <div className="size-1.5 animate-pulse rounded-full bg-[#6f2c3e]" />
                  <span className="text-[11px] tracking-wide text-[#a8a8a3]">Ready to generate</span>
                </div>
              </div>
            </>
          )}

          {/* ANALYZING */}
          {status === "analyzing" && (
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-full bg-[#6f2c3e]/15 blur-2xl" />
                  <div className="relative flex size-14 items-center justify-center rounded-[16px] border border-[#6f2c3e]/30 bg-[#6f2c3e] text-[#f5f5f3]">
                    <div className="size-6 animate-spin rounded-full border-2 border-[#f5f5f3]/20 border-t-[#f5f5f3]" />
                  </div>
                </div>
                <h3 className="mt-6 text-[16px] font-[600] tracking-[-0.01em] text-[#f5f5f3]">Analyzing sketch</h3>
                <p className="mt-2 text-[13px] text-[#a8a8a3]">{progressMessage}</p>
                <div className="mt-8 w-full max-w-[280px]">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div className="h-full w-2/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-[#6f2c3e]" />
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-[#a8a8a3]/60">
                    <span>Gemini 3.5 Flash Lite</span>
                    <span>~5-10s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
              <div className="flex w-full max-w-[320px] flex-col items-center rounded-[16px] border border-[#6f2c3e]/30 bg-[#6f2c3e]/10 px-6 py-6 backdrop-blur">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#6f2c3e]/20 text-[#f5f5f3]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8V12M12 16H12.01" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-[#f5f5f3]">Analysis failed</h3>
                <p className="mt-2 text-center text-[12.5px] leading-[1.5] text-[#f5f5f3]/70">{error}</p>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && result && (
            <div className="relative z-10 flex flex-1 flex-col overflow-hidden bg-[#1c1c1c]">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#242424] px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-full bg-[#6f2c3e] text-[#f5f5f3]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6L4.5 8.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-[650] tracking-[-0.01em] text-[#f5f5f3]">PROTOTYPE READY</p>
                    <p className="text-[11px] text-[#a8a8a3]">
                      {result.screen.name} • {componentCount} components • interactive
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="size-1.5 animate-pulse rounded-full bg-[#6f2c3e]" />
                  <span className="text-[11px] font-medium text-[#a8a8a3]">Live</span>
                </div>
              </div>

              {showJson && (
                <div className="border-b border-[#2a2a2a] bg-[#161616] p-3">
                  <div className="rounded-[10px] border border-[#2e2e2e] bg-[#1e1e1e] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
                      <span className="font-mono text-[11px] text-[#a8a8a3]">UI JSON • validated</span>
                      <button onClick={handleCopy} className="text-[11px] text-[#a8a8a3] hover:text-[#f5f5f3]">
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="max-h-[200px] overflow-auto p-3 font-mono text-[11px] leading-[1.6] text-[#a8a8a3]">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto bg-[#1e1e1e] p-2 sm:p-3">
                <PrototypeRenderer schema={result} viewMode={viewMode} resetKey={resetKey} />
              </div>

              <div className="border-t border-[#2a2a2a] bg-[#242424] px-4 py-2 flex items-center justify-between text-[11px] text-[#a8a8a3]">
                <span>
                  Inputs are functional • {viewMode === "mobile" ? "Mobile 390px" : "Desktop auto"} • Click SIGN IN → dashboard
                </span>
                <span className="hidden sm:inline">IMAGE → AI → VALID JSON → REACT</span>
              </div>
            </div>
          )}

          {status !== "success" && (
            <div className="relative z-10 mt-auto flex items-center justify-between border-t border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest text-[#a8a8a3]/40">CANVAS</span>
                <div className="h-3 w-px bg-[#2a2a2a]" />
                <span className="text-[11px] text-[#a8a8a3]/60">
                  {status === "analyzing" ? progressMessage : "No output yet"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1 w-8 rounded-full bg-[#2a2a2a]" />
                <div className="h-1 w-4 rounded-full bg-[#242424]" />
              </div>
            </div>
          )}
        </div>

        {status !== "success" && (
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-full border border-[#2e2e2e] bg-[#242424]">
                <div className="size-1 rounded-full bg-[#a8a8a3]/50" />
              </div>
              <span className="text-[11px] text-[#a8a8a3]/60">Prototype URL will be generated after analysis</span>
            </div>
            <div className="hidden items-center gap-1.5 text-[10px] text-[#a8a8a3]/30 sm:flex">
              <span>1280×800</span>
              <span className="opacity-50">•</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}

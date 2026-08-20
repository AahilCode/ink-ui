"use client";
import React from "react";

type Props = {
  disabled: boolean;
  isAnalyzing: boolean;
  hasImage: boolean;
  onClick: () => void;
};

export function AnalyzeButton({ disabled, isAnalyzing, hasImage, onClick }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 sm:py-8">
      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-white/[0.06] blur-2xl" />
        <button
          disabled={disabled}
          onClick={onClick}
          className="relative inline-flex h-[48px] sm:h-[52px] min-w-[200px] sm:min-w-[240px] items-center justify-center gap-2.5 rounded-full bg-white px-8 text-[14px] font-[600] tracking-[-0.01em] text-black shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-[0.42] hover:enabled:bg-zinc-100 hover:enabled:scale-[1.02] active:enabled:scale-[0.98] group"
        >
          {isAnalyzing ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              <span className="relative z-10">Analyzing...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Analyze Sketch</span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-black text-white">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-90">
                  <path
                    d="M4 2.5L8 6L4 9.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        {!hasImage ? (
          <p className="text-center text-[12px] leading-[1.4] text-white/35">Upload a sketch to enable analysis</p>
        ) : isAnalyzing ? (
          <p className="text-center text-[12px] leading-[1.4] text-white/50">Contacting AI... please wait</p>
        ) : (
          <p className="text-center text-[12px] leading-[1.4] text-white/35">IMAGE ↓ AI ↓ VALID JSON — pipeline ready</p>
        )}

        <div className="flex items-center gap-2 text-[11px] text-white/20">
          <div className={`size-1 rounded-full ${hasImage ? "bg-emerald-400/60 animate-pulse" : "bg-white/20"}`} />
          <span>{isAnalyzing ? "AI understanding your sketch" : hasImage ? "Ready to analyze" : "Awaiting sketch"}</span>
        </div>
      </div>
    </div>
  );
}

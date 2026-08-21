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
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-[#6f2c3e]/20 blur-2xl" />
        <button
          disabled={disabled}
          onClick={onClick}
          className="relative inline-flex h-[48px] sm:h-[52px] min-w-[200px] sm:min-w-[240px] items-center justify-center gap-2.5 rounded-full bg-[#6f2c3e] px-8 text-[14px] font-[600] tracking-[-0.01em] text-[#f5f5f3] shadow-[0_0_0_1px_rgba(111,44,62,0.3)_inset,0_8px_24px_rgba(111,44,62,0.25),0_1px_2px_rgba(0,0,0,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-[0.35] hover:enabled:bg-[#7d3346] hover:enabled:scale-[1.02] active:enabled:scale-[0.98] group"
        >
          {isAnalyzing ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-[#f5f5f3]/20 border-t-[#f5f5f3]" />
              <span className="relative z-10">Analyzing...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Analyze Sketch</span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[#1c1c1c] text-[#f5f5f3]">
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
          <p className="text-center text-[12px] leading-[1.4] text-[#a8a8a3]/60">Upload a sketch to enable analysis</p>
        ) : isAnalyzing ? (
          <p className="text-center text-[12px] leading-[1.4] text-[#f5f5f3]/70">Contacting Gemini... please wait</p>
        ) : (
          <p className="text-center text-[12px] leading-[1.4] text-[#a8a8a3]/60">IMAGE ↓ AI ↓ VALID JSON — pipeline ready</p>
        )}

        <div className="flex items-center gap-2 text-[11px] text-[#a8a8a3]/40">
          <div className={`size-1 rounded-full ${hasImage ? "bg-[#6f2c3e] animate-pulse" : "bg-[#2e2e2e]"}`} />
          <span>{isAnalyzing ? "Gemini understanding your sketch" : hasImage ? "Ready to analyze" : "Awaiting sketch"}</span>
        </div>
      </div>
    </div>
  );
}

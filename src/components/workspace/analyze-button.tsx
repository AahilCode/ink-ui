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
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-r from-[#4E1F6E]/20 to-[#45A9A9]/15 blur-2xl" />
        <button
          disabled={disabled}
          onClick={onClick}
          className="relative inline-flex h-[48px] sm:h-[52px] min-w-[200px] sm:min-w-[240px] items-center justify-center gap-2.5 rounded-full bg-[#4E1F6E] px-8 text-[14px] font-[600] tracking-[-0.01em] text-[#f0eef6] shadow-[0_0_0_1px_rgba(78,31,110,0.4)_inset,0_8px_24px_rgba(78,31,110,0.3),0_1px_2px_rgba(0,0,0,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-[0.35] hover:enabled:bg-[#5e2585] hover:enabled:shadow-[0_0_20px_rgba(78,31,110,0.4)] hover:enabled:scale-[1.02] active:enabled:scale-[0.98] group"
        >
          {isAnalyzing ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-[#f0eef6]/20 border-t-[#98E8DE]" />
              <span className="relative z-10">Analyzing...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Analyze Sketch</span>
              <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[#13111e] text-[#98E8DE] group-hover:text-[#f0eef6] transition-colors">
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
          <p className="text-center text-[12px] leading-[1.4] text-[#a8a6b8]/60">Upload a sketch to enable analysis</p>
        ) : isAnalyzing ? (
          <p className="text-center text-[12px] leading-[1.4] text-[#98E8DE]">Contacting Gemini... please wait</p>
        ) : (
          <p className="text-center text-[12px] leading-[1.4] text-[#a8a6b8]/60">IMAGE ↓ AI ↓ VALID JSON — pipeline ready</p>
        )}

        <div className="flex items-center gap-2 text-[11px] text-[#a8a6b8]/40">
          <div className={`size-1 rounded-full ${hasImage ? "bg-[#45A9A9] animate-pulse shadow-[0_0_6px_rgba(69,169,169,0.5)]" : "bg-[#3E3E75]/40"}`} />
          <span>{isAnalyzing ? "Gemini understanding your sketch" : hasImage ? "Ready to analyze" : "Awaiting sketch"}</span>
        </div>
      </div>
    </div>
  );
}

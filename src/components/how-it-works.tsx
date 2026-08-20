"use client";
import React from "react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Label */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1">
              <div className="size-1.5 rounded-full bg-white/40" />
              <span className="text-[11px] font-medium tracking-[0.14em] text-white/50">HOW IT WORKS</span>
            </div>
            <h2 className="mt-4 max-w-[280px] text-[18px] font-[550] leading-[1.25] tracking-[-0.02em] text-white/80">
              From paper sketch to interactive UI in three steps.
            </h2>
          </div>

          {/* Steps */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 sm:gap-0 rounded-[20px] border border-white/[0.06] bg-[#101012] overflow-hidden">
              {/* Step 01 */}
              <div className="group relative flex flex-col p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-white/[0.06]">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-white/25">01</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M8 3V8L11 10" strokeLinecap="round" />
                      <circle cx="8" cy="8" r="5" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-white">Sketch</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-white/45">
                  Draw your interface on paper. Boxes, buttons, inputs — any layout.
                </p>

                {/* Visual flow arrow - mobile vertical */}
                <div className="absolute -bottom-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-[#151518] text-white/30 sm:hidden">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2.5V9.5M6 9.5L3.5 7M6 9.5L8.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Desktop arrow */}
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-[#151518] text-white/30">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Step 02 */}
              <div className="group relative flex flex-col p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-white/[0.06] bg-white/[0.01]">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-white/25">02</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M8 2L10.5 5.5L14 6L11 9L11.8 13L8 11L4.2 13L5 9L2 6L5.5 5.5L8 2Z" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-white">AI understands</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-white/45">
                  Multimodal model parses structure, hierarchy, and intent into JSON.
                </p>

                <div className="absolute -bottom-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-[#151518] text-white/30 sm:hidden">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2.5V9.5M6 9.5L3.5 7M6 9.5L8.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-[#151518] text-white/30">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Step 03 */}
              <div className="group relative flex flex-col p-6 sm:p-7">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-white/25">03</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-white/[0.08] bg-white text-black">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M2 6H10M6 2V10" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-white">Prototype</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-white/45">
                  Instantly render a working, interactive UI you can edit and export.
                </p>
              </div>
            </div>

            {/* Compact flow statement */}
            <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start px-1">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                <span className="text-[11px] font-medium tracking-wide text-white/35">Sketch</span>
                <span className="text-white/20">→</span>
                <span className="text-[11px] font-medium tracking-wide text-white/55">AI</span>
                <span className="text-white/20">→</span>
                <span className="text-[11px] font-medium tracking-wide text-white">Interactive UI</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/25">
                <div className="size-1 rounded-full bg-white/20 animate-pulse" />
                Compact demo flow — AI pipeline coming next
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

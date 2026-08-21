"use client";
import React from "react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[#3E3E75]/30">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3E3E75]/40 bg-[#1d1b2a] px-3 py-1">
              <div className="size-1.5 rounded-full bg-[#45A9A9]" />
              <span className="text-[11px] font-medium tracking-[0.14em] text-[#a8a6b8]">HOW IT WORKS</span>
            </div>
            <h2 className="mt-4 max-w-[280px] text-[18px] font-[550] leading-[1.25] tracking-[-0.02em] text-[#f0eef6]/80">
              From paper sketch to interactive UI in three steps.
            </h2>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 sm:gap-0 rounded-[20px] border border-[#3E3E75]/30 bg-[#1d1b2a] overflow-hidden">
              <div className="group relative flex flex-col p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-[#3E3E75]/30">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-[#a8a6b8]/40">01</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-[#3E3E75]/40 bg-[#242236] text-[#a8a6b8]">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M8 3V8L11 10" strokeLinecap="round" />
                      <circle cx="8" cy="8" r="5" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-[#f0eef6]">Sketch</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#a8a6b8]">
                  Draw your interface on paper. Boxes, buttons, inputs — any layout.
                </p>

                <div className="absolute -bottom-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#3E3E75]/40 bg-[#13111e] text-[#a8a6b8]/60 sm:hidden">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2.5V9.5M6 9.5L3.5 7M6 9.5L8.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex size-6 items-center justify-center rounded-full border border-[#3E3E75]/40 bg-[#13111e] text-[#a8a6b8]/60">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="group relative flex flex-col p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-[#3E3E75]/30 bg-gradient-to-br from-[#4E1F6E]/15 via-[#3E3E75]/15 to-[#45A9A9]/10">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-[#45A9A9]">02</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-[#45A9A9]/30 bg-[#45A9A9]/20 text-[#45A9A9]">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M8 2L10.5 5.5L14 6L11 9L11.8 13L8 11L4.2 13L5 9L2 6L5.5 5.5L8 2Z" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-[#f0eef6]">AI understands</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#a8a6b8]">
                  Gemini 3.5 Flash Lite parses structure, hierarchy, and intent into JSON.
                </p>

                <div className="absolute -bottom-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#45A9A9]/30 bg-[#13111e] text-[#45A9A9]/70 sm:hidden">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2.5V9.5M6 9.5L3.5 7M6 9.5L8.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex size-6 items-center justify-center rounded-full border border-[#45A9A9]/30 bg-[#13111e] text-[#45A9A9]/70">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="group relative flex flex-col p-6 sm:p-7">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-widest text-[#a8a6b8]/40">03</span>
                  <div className="flex size-6 items-center justify-center rounded-full border border-[#4E1F6E] bg-[#4E1F6E] text-[#f0eef6]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M2 6H10M6 2V10" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[15px] font-[600] tracking-[-0.01em] text-[#f0eef6]">Prototype</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#a8a6b8]">
                  Instantly render a working, interactive UI you can edit and export.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start px-1">
              <div className="flex items-center gap-2 rounded-full border border-[#3E3E75]/30 bg-[#1d1b2a] px-3 py-1.5">
                <span className="text-[11px] font-medium tracking-wide text-[#a8a6b8]">Sketch</span>
                <span className="text-[#a8a6b8]/40">→</span>
                <span className="text-[11px] font-medium tracking-wide text-[#45A9A9]">AI</span>
                <span className="text-[#a8a8a3]/40">→</span>
                <span className="text-[11px] font-medium tracking-wide text-[#f0eef6]">Interactive UI</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#a8a6b8]/60">
                <div className="size-1 rounded-full bg-[#98E8DE] animate-pulse shadow-[0_0_6px_rgba(152,232,222,0.5)]" />
                Free tier • Gemini 3.5 Flash Lite
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import React from "react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2a2a] bg-[#1c1c1c]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1600px] items-center justify-between px-5 sm:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 items-center justify-center rounded-[10px] bg-[#6f2c3e] text-[#f5f5f3] shadow-[0_0_0_1px_rgba(111,44,62,0.3),0_1px_2px_rgba(0,0,0,0.4)]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="translate-y-[0.5px]">
                <path
                  d="M8 2C8 2 4.5 5 4.5 8.5C4.5 10.985 6.015 13 8 13C9.985 13 11.5 10.985 11.5 8.5C11.5 5 8 2 8 2Z"
                  fill="currentColor"
                />
                <path d="M8 13V14.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15.5px] font-[650] tracking-[-0.02em] text-[#f5f5f3]">INK UI</span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-[#6f2c3e]/30 bg-[#6f2c3e]/15 px-2 py-0.5 text-[9.5px] font-medium tracking-widest text-[#f5f5f3]/60">
                GEMINI
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <nav className="flex items-center gap-1 sm:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#how-it-works"
              className="text-[13.5px] font-[450] tracking-[-0.01em] text-[#a8a8a3] transition-colors hover:text-[#f5f5f3]"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-[13.5px] font-[450] tracking-[-0.01em] text-[#a8a8a3] transition-colors hover:text-[#f5f5f3]"
            >
              About
            </a>
          </div>

          <div className="ml-2 flex items-center gap-2">
            <div className="hidden h-5 w-px bg-[#2e2e2e] md:block" />
            <button
              aria-label="Settings"
              className="group flex size-8 items-center justify-center rounded-full border border-[#2e2e2e] bg-[#242424] text-[#a8a8a3] transition-all hover:bg-[#2a2a2a] hover:text-[#f5f5f3] hover:border-[#6f2c3e]/30"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="transition-transform group-hover:rotate-45 duration-300">
                <circle cx="8" cy="8" r="2.2" />
                <path d="M8 12.5V11M8 5V3.5M11.5 8H13M3 8H4.5M11.18 11.18L12.24 12.24M3.76 3.76L4.82 4.82M11.18 4.82L12.24 3.76M3.76 12.24L4.82 11.18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

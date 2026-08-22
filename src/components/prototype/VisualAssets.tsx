"use client";
import React from "react";

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
};

interface AssetProps {
  palette: Palette;
  hint?: string;
  className?: string;
}

/* Lightweight icon set – consistent line style */
export function IconSearch({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <circle cx="7" cy="7" r="4" />
      <path d="M10.5 10.5L13 13" strokeLinecap="round" />
    </svg>
  );
}
export function IconUser({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <circle cx="8" cy="5" r="2.5" />
      <path d="M3.5 12.5C3.5 9.5 5.5 8 8 8C10.5 8 12.5 9.5 12.5 12.5" strokeLinecap="round" />
    </svg>
  );
}
export function IconSettings({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 3V4.5M8 11.5V13M3 8H4.5M11.5 8H13M11.9 4.1L10.9 5.1M5.1 10.9L4.1 11.9M11.9 11.9L10.9 10.9M5.1 5.1L4.1 4.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconShopping({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2.5 4H13.5L12 12H4L2.5 4Z" />
      <path d="M6 4V3C6 2 7 1 8 1C9 1 10 2 10 3V4" />
    </svg>
  );
}
export function IconHome({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2 7L8 2L14 7V13C14 13.6 13.6 14 13 14H3C2.4 14 2 13.6 2 13V7Z" />
      <path d="M6 14V9H10V14" />
    </svg>
  );
}
export function IconDashboard({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}
export function IconLock({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <rect x="3.5" y="6.5" width="9" height="7" rx="2" />
      <path d="M6 6.5V4.5C6 2.8 6.9 2 8 2C9.1 2 10 2.8 10 4.5V6.5" />
    </svg>
  );
}
export function IconMail({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <rect x="2" y="3" width="12" height="9" rx="2" />
      <path d="M2.5 4L8 8L13.5 4" />
    </svg>
  );
}

export function getIconForHint(hint?: string, text?: string): React.ReactNode | null {
  const combined = `${hint || ""} ${text || ""}`.toLowerCase();
  if (combined.includes("search")) return <IconSearch />;
  if (combined.includes("user") || combined.includes("profile") || combined.includes("avatar")) return <IconUser />;
  if (combined.includes("setting")) return <IconSettings />;
  if (combined.includes("shop") || combined.includes("cart") || combined.includes("product") || combined.includes("buy")) return <IconShopping />;
  if (combined.includes("home")) return <IconHome />;
  if (combined.includes("dashboard") || combined.includes("stat") || combined.includes("analytics")) return <IconDashboard />;
  if (combined.includes("lock") || combined.includes("password") || combined.includes("secure")) return <IconLock />;
  if (combined.includes("mail") || combined.includes("email") || combined.includes("login") || combined.includes("sign")) return <IconMail />;
  return null;
}

/* Abstract graphics – lightweight, palette-aware */

export function AbstractGeometric({ palette, hint }: AssetProps) {
  const lower = (hint || "").toLowerCase();
  const isTravel = lower.includes("travel") || lower.includes("mountain") || lower.includes("beach") || lower.includes("map");
  const isProduct = lower.includes("product") || lower.includes("shop") || lower.includes("ecommerce") || lower.includes("chair") || lower.includes("item");
  const isData = lower.includes("data") || lower.includes("chart") || lower.includes("graph") || lower.includes("dashboard") || lower.includes("stat") || lower.includes("analytics");
  const isAvatar = lower.includes("avatar") || lower.includes("profile") || lower.includes("user");
  const isHero = lower.includes("hero");

  if (isTravel) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[12px]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.primary}18, ${palette.accent}18)` }} />
        <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full">
          <path d="M0 90 Q40 60 80 80 T160 70 L200 90 L200 120 L0 120 Z" fill={palette.accent} fillOpacity="0.18" />
          <path d="M0 100 Q60 70 120 90 T200 80 L200 120 L0 120 Z" fill={palette.primary} fillOpacity="0.15" />
          <circle cx="150" cy="30" r="18" fill={palette.accent} fillOpacity="0.12" />
          <path d="M30 85 L50 55 L70 75 L90 50 L110 85" stroke={palette.primary} strokeOpacity="0.25" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-zinc-600 backdrop-blur">Travel</div>
      </div>
    );
  }

  if (isProduct) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[12px] bg-white flex items-center justify-center">
        <div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 50% 30%, ${palette.primary}12, transparent)` }} />
        <div className="relative">
          <div className="h-16 w-16 rounded-[14px] bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-center">
            <div className="h-8 w-8 rounded-[8px] bg-gradient-to-br from-[#4E1F6E]/20 to-[#45A9A9]/20 border border-[#4E1F6E]/10" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#4E1F6E] border-2 border-white flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (isData) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[12px] bg-white p-3">
        <div className="flex h-full flex-col justify-between">
          <div className="flex gap-1.5">
            <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: `${palette.primary}22` }} />
            <div className="h-1.5 w-4 rounded-full bg-zinc-100" />
          </div>
          <div className="flex items-end gap-1.5 h-12">
            {[35, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[4px]"
                style={{
                  height: `${h}%`,
                  background: i % 2 === 0 ? `linear-gradient(180deg, ${palette.primary}, ${palette.secondary})` : `${palette.accent}`,
                  opacity: 0.6 + i * 0.05,
                }}
              />
            ))}
          </div>
          <div className="h-1 w-full rounded-full bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (isAvatar) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[12px] bg-gradient-to-br from-[#4E1F6E]/10 via-[#3E3E75]/10 to-[#45A9A9]/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-full bg-gradient-to-br from-[#4E1F6E] to-[#45A9A9] p-[2px] shadow-sm">
            <div className="size-full rounded-full bg-white flex items-center justify-center text-[14px] font-bold text-[#4E1F6E]">A</div>
          </div>
          <div className="h-1.5 w-12 rounded-full bg-[#3E3E75]/20" />
          <div className="h-1 w-8 rounded-full bg-[#3E3E75]/10" />
        </div>
      </div>
    );
  }

  if (isHero) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[14px]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.primary}14, ${palette.secondary}14, ${palette.accent}14)` }} />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(rgba(0,0,0,0.8)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <svg viewBox="0 0 300 160" className="absolute inset-0 h-full w-full">
          <circle cx="230" cy="30" r="40" fill={palette.accent} fillOpacity="0.08" />
          <circle cx="40" cy="120" r="30" fill={palette.primary} fillOpacity="0.08" />
          <rect x="60" y="40" width="80" height="60" rx="16" fill="white" fillOpacity="0.7" stroke={palette.primary} strokeOpacity="0.08" />
          <rect x="160" y="60" width="60" height="40" rx="12" fill="white" fillOpacity="0.6" stroke={palette.accent} strokeOpacity="0.08" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm border border-white/50">Hero Visual</div>
        </div>
      </div>
    );
  }

  // Default abstract
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[12px]">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.primary}10, ${palette.secondary}10, ${palette.accent}10)` }} />
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full opacity-60">
        <circle cx="50" cy="40" r="25" fill={palette.primary} fillOpacity="0.08" />
        <circle cx="150" cy="80" r="35" fill={palette.accent} fillOpacity="0.08" />
        <rect x="70" y="30" width="60" height="40" rx="12" fill="white" fillOpacity="0.5" stroke={palette.secondary} strokeOpacity="0.1" />
      </svg>
    </div>
  );
}

export function HeroComposition({ palette, hint }: AssetProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-white">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.background}, ${palette.surface})` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#4E1F6E]/10 via-[#3E3E75]/8 to-[#45A9A9]/10" />
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-2xl" style={{ background: `${palette.primary}18` }} />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full blur-xl" style={{ background: `${palette.accent}18` }} />
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
        <circle cx="320" cy="40" r="50" fill={palette.accent} fillOpacity="0.06" />
        <circle cx="80" cy="150" r="40" fill={palette.primary} fillOpacity="0.06" />
        <path d="M0 160 Q100 120 200 140 T400 130 L400 200 L0 200 Z" fill={palette.secondary} fillOpacity="0.08" />
      </svg>
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#4E1F6E] to-[#45A9A9] text-white shadow-[0_0_12px_rgba(78,31,110,0.25)]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 10L7 6L10 9L17 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 3H17V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[12px] font-medium tracking-wide text-zinc-500">{hint || "Polished hero – designed from rough sketch"}</p>
      </div>
    </div>
  );
}

export function CardVisual({ palette, hint }: AssetProps) {
  return (
    <div className="h-24 w-full overflow-hidden rounded-t-[14px] relative bg-gradient-to-br from-zinc-50 to-white border-b border-zinc-100">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.primary}08, ${palette.accent}08)` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <AbstractGeometric palette={palette} hint={hint} />
      </div>
    </div>
  );
}

"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo, useEffect } from "react";
import type {
  UISchema,
  UIComponent,
  HeadingComponent,
  TextComponent,
  InputComponent,
  ButtonComponent,
  CardComponent,
  ImageComponent,
  ColorPalette,
  TypographySystem,
} from "@/lib/ui-schema";
import {
  AbstractGeometric,
  HeroComposition,
  CardVisual,
  getIconForHint,
} from "./VisualAssets";
import { loadFontsForTypography, getFontFamilyCss, isDecorativeFont } from "@/lib/fonts";

type ViewMode = "desktop" | "mobile";
type Screen = "generated" | "dashboard";

interface Props {
  schema: UISchema;
  viewMode: ViewMode;
  resetKey?: number;
}

function isPasswordField(comp: UIComponent): boolean {
  const id = comp.id.toLowerCase();
  if (id.includes("password") || id.includes("pwd")) return true;
  if (comp.type === "input") {
    const placeholder = (comp as InputComponent).placeholder?.toLowerCase() || "";
    const text = (comp as InputComponent).text?.toLowerCase() || "";
    if (placeholder.includes("password") || text.includes("password")) return true;
  }
  return false;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function useDesignTokens(schema: UISchema) {
  const design = schema.screen.design;
  const palette: ColorPalette = design?.colorPalette || {};
  const typography: TypographySystem = design?.typography || {};
  const layout = design?.layout || {};

  // Legacy fontFamily fallback for backward compat
  const legacyFont = typography.fontFamily || "Inter, ui-sans-system, system-ui, sans-serif";

  // New intelligent fields with fallbacks
  const displayFont = typography.displayFont || typography.headingFont || legacyFont;
  const headingFont = typography.headingFont || displayFont;
  const bodyFont = typography.bodyFont || legacyFont;
  const accentFont = typography.accentFont; // optional, used sparingly
  const monoFont = typography.monoFont || "'JetBrains Mono', monospace";

  return {
    palette: {
      primary: palette.primary || "#4E1F6E",
      secondary: palette.secondary || "#3E3E75",
      accent: palette.accent || "#45A9A9",
      background: palette.background || "#fcfcfd",
      surface: palette.surface || "#ffffff",
      text: palette.text || "#18181b",
      muted: palette.muted || "#71717a",
      border: palette.border || "#e4e4e7",
    },
    typography: {
      fontFamily: legacyFont,
      displayFont,
      headingFont,
      bodyFont,
      accentFont,
      monoFont,
      headingWeight: typography.headingWeight || 700,
      bodyWeight: typography.bodyWeight || 450,
      letterSpacing: typography.letterSpacing || " -0.01em",
      headingLineHeight: typography.headingLineHeight || "1.15",
      bodyLineHeight: typography.bodyLineHeight || "1.6",
      fontPersonality: typography.fontPersonality || "modern",
    },
    layout: {
      alignment: layout.alignment || "left",
      spacing: layout.spacing || "comfortable",
      style: layout.style || "minimal",
    },
    rawDesign: design,
  };
}

function inferScreenPurpose(name: string, components: UIComponent[]): string {
  const lowerName = name.toLowerCase();
  const allText = components
    .map((c) => ("text" in c ? (c as { text?: string }).text : "") + " " + ("placeholder" in c ? (c as InputComponent).placeholder : "") + " " + (c as ImageComponent).alt)
    .join(" ")
    .toLowerCase();

  const combined = `${lowerName} ${allText}`;

  if (combined.includes("travel") || combined.includes("trip") || combined.includes("beach") || combined.includes("hotel")) return "travel";
  if (combined.includes("shop") || combined.includes("product") || combined.includes("cart") || combined.includes("ecommerce") || combined.includes("store")) return "ecommerce";
  if (combined.includes("finance") || combined.includes("bank") || combined.includes("revenue") || combined.includes("money")) return "finance";
  if (combined.includes("education") || combined.includes("learn") || combined.includes("course") || combined.includes("student")) return "education";
  if (combined.includes("portfolio") || combined.includes("art") || combined.includes("creative") || combined.includes("gallery")) return "portfolio";
  if (combined.includes("dashboard") || combined.includes("analytics") || combined.includes("stat") || combined.includes("data")) return "dashboard";
  if (combined.includes("login") || combined.includes("sign")) return "login";
  if (combined.includes("blog") || combined.includes("article") || combined.includes("post")) return "blog";
  if (combined.includes("luxury") || combined.includes("jewelry") || combined.includes("fashion") || combined.includes("wedding")) return "luxury";
  if (combined.includes("restaurant") || combined.includes("food") || combined.includes("cafe")) return "restaurant";
  if (combined.includes("journal") || combined.includes("diary") || combined.includes("note")) return "journal";
  return lowerName || "generic";
}

function GeneratedHeading({ comp, tokens, isDisplay }: { comp: HeadingComponent; tokens: ReturnType<typeof useDesignTokens>; isDisplay?: boolean }) {
  const isAllCaps = comp.text === comp.text.toUpperCase() && comp.text.length < 20;
  const isHero = comp.y < 150 && comp.width > 500;
  const useDisplay = isDisplay || isHero;

  const fontFamily = useDisplay
    ? getFontFamilyCss(tokens.typography.displayFont, tokens.typography.headingFont)
    : getFontFamilyCss(tokens.typography.headingFont, tokens.typography.bodyFont);

  const finalFamily = fontFamily;

  return (
    <div className="flex h-full w-full items-center">
      <h1
        style={{
          fontFamily: finalFamily,
          fontWeight: tokens.typography.headingWeight,
          color: tokens.palette.text,
          letterSpacing: tokens.typography.letterSpacing,
          lineHeight: tokens.typography.headingLineHeight,
        }}
        className={`w-full text-left tracking-[-0.02em] ${useDisplay ? "text-[30px] sm:text-[38px]" : isAllCaps ? "text-[28px] sm:text-[32px]" : "text-[22px] sm:text-[26px]"}`}
      >
        {comp.text}
        {isHero && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#45A9A9] animate-pulse align-super" />}
      </h1>
    </div>
  );
}

function GeneratedText({ comp, tokens, isAccent }: { comp: TextComponent; tokens: ReturnType<typeof useDesignTokens>; isAccent?: boolean }) {
  // Use accentFont only for small labels, quotes, accents – not for large body
  // Heuristic: if isAccent and accentFont exists and text is short (<80 chars) and not form-related, use accentFont
  const shouldUseAccent = isAccent && tokens.typography.accentFont && comp.text.length < 100 && !isDecorativeFont(tokens.typography.bodyFont);

  let fontFamily: string;
  if (shouldUseAccent) {
    fontFamily = getFontFamilyCss(tokens.typography.accentFont, tokens.typography.bodyFont);
  } else {
    fontFamily = getFontFamilyCss(tokens.typography.bodyFont, tokens.typography.fontFamily);
  }

  // Never use decorative for long body text – fallback to bodyFont if accent is decorative and text long
  if (comp.text.length > 120 && isDecorativeFont(fontFamily)) {
    fontFamily = getFontFamilyCss(tokens.typography.bodyFont);
  }

  return (
    <div className="flex h-full w-full items-center">
      <p
        style={{
          fontFamily,
          fontWeight: tokens.typography.bodyWeight,
          color: shouldUseAccent ? tokens.palette.text : tokens.palette.muted,
          lineHeight: tokens.typography.bodyLineHeight,
        }}
        className={`w-full ${shouldUseAccent ? "text-[13px] italic" : "text-[14px]"} leading-[1.6]`}
      >
        {comp.text}
      </p>
    </div>
  );
}

function GeneratedInput({
  comp,
  value,
  onChange,
  tokens,
}: {
  comp: InputComponent;
  value: string;
  onChange: (v: string) => void;
  tokens: ReturnType<typeof useDesignTokens>;
}) {
  const isPassword = isPasswordField(comp);
  const label = comp.placeholder || comp.text || "";
  const icon = getIconForHint(comp.icon || comp.visualHint, label);

  // Inputs must NOT use decorative fonts – always use bodyFont for readability per spec
  const fontFamily = getFontFamilyCss(tokens.typography.bodyFont);

  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="group relative w-full">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#4E1F6E] transition-colors">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label || "Enter text"}
          style={{
            fontFamily,
            backgroundColor: tokens.palette.surface,
            color: tokens.palette.text,
            borderColor: tokens.palette.border,
            paddingLeft: icon ? "36px" : "16px",
          }}
          className="h-[44px] w-full rounded-[12px] border px-4 text-[14px] font-[450] placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:ring-[3px]"
        />
        <style jsx>{`
          input:focus {
            border-color: ${tokens.palette.primary} !important;
            box-shadow: 0 0 0 3px ${tokens.palette.primary}22;
          }
        `}</style>
      </div>
    </div>
  );
}

function GeneratedButton({
  comp,
  onClick,
  tokens,
}: {
  comp: ButtonComponent;
  onClick: () => void;
  tokens: ReturnType<typeof useDesignTokens>;
}) {
  const isPrimary =
    comp.text.toLowerCase().includes("sign in") ||
    comp.text.toLowerCase().includes("login") ||
    comp.text.toLowerCase().includes("continue") ||
    comp.text.toLowerCase().includes("get started") ||
    comp.text.toLowerCase().includes("explore") ||
    comp.action?.toLowerCase().includes("dashboard");

  const icon = getIconForHint(comp.icon || comp.visualHint, comp.text);

  // Buttons must NOT use handwritten/script for accessibility – use headingFont or bodyFont unless design specifically calls for display
  // If headingFont is decorative but button is primary, fallback to bodyFont for readability unless it's bold display which is okay
  let fontFamily = getFontFamilyCss(tokens.typography.headingFont || tokens.typography.bodyFont);
  if (isDecorativeFont(fontFamily) && (fontFamily.toLowerCase().includes("caveat") || fontFamily.toLowerCase().includes("vibes") || fontFamily.toLowerCase().includes("allura"))) {
    // Handwritten/script not for buttons per spec
    fontFamily = getFontFamilyCss(tokens.typography.bodyFont);
  }

  return (
    <div className="flex h-full w-full items-center">
      <button
        onClick={onClick}
        style={{
          fontFamily,
          ...(isPrimary
            ? {
                background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.secondary})`,
                color: "#f0eef6",
                borderColor: tokens.palette.primary,
              }
            : {
                backgroundColor: tokens.palette.surface,
                color: tokens.palette.text,
                borderColor: tokens.palette.border,
              }),
        }}
        className={`flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border px-5 text-[14px] font-[600] tracking-[-0.01em] transition-all active:scale-[0.98] shadow-sm hover:brightness-110 hover:shadow-[0_0_12px_rgba(78,31,110,0.15)]`}
      >
        {icon && <span className="opacity-90">{icon}</span>}
        {comp.text}
      </button>
    </div>
  );
}

function GeneratedCard({ comp, tokens, screenPurpose }: { comp: CardComponent; tokens: ReturnType<typeof useDesignTokens>; screenPurpose: string }) {
  const hasVisual = comp.hasImage || !!comp.imageHint || !!comp.visualHint || comp.width > 250;
  const imageHint = comp.imageHint || comp.visualHint || `${screenPurpose} card`;

  // Cards use bodyFont for content, not decorative
  const fontFamily = getFontFamilyCss(tokens.typography.bodyFont);

  return (
    <div className="flex h-full w-full">
      <div
        style={{
          backgroundColor: tokens.palette.surface,
          borderColor: tokens.palette.border,
        }}
        className="flex w-full flex-col overflow-hidden rounded-[16px] border shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#45A9A9]/20 transition-all"
      >
        {hasVisual && <CardVisual palette={tokens.palette} hint={imageHint} />}
        <div className="p-4">
          <div
            className="mb-2 h-2 w-8 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${tokens.palette.primary}22, ${tokens.palette.accent}22)`,
            }}
          />
          <p style={{ color: tokens.palette.text, fontFamily }} className="text-[13px] font-[500] leading-[1.4]">
            {comp.text || "Card content"}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-100" />
            <div className="h-2 w-2/3 rounded-full bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneratedImage({ comp, tokens, screenPurpose, isHero }: { comp: ImageComponent; tokens: ReturnType<typeof useDesignTokens>; screenPurpose: string; isHero: boolean }) {
  const hint = comp.alt || comp.visualHint || comp.imageHint || screenPurpose;
  const fullHint = `${hint} ${screenPurpose}`;

  if (isHero) {
    return (
      <div className="flex h-full w-full">
        <HeroComposition palette={tokens.palette} hint={hint} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <div
        style={{
          borderColor: tokens.palette.border,
        }}
        className="flex w-full overflow-hidden rounded-[14px] border bg-white shadow-sm hover:shadow-md hover:border-[#45A9A9]/20 transition-all"
      >
        <AbstractGeometric palette={tokens.palette} hint={fullHint} />
      </div>
    </div>
  );
}

function DashboardScreen({ onBack, tokens }: { onBack?: () => void; tokens: ReturnType<typeof useDesignTokens> }) {
  // Dashboard uses headingFont for title, bodyFont for content
  const headingFamily = getFontFamilyCss(tokens.typography.headingFont || tokens.typography.displayFont);
  const bodyFamily = getFontFamilyCss(tokens.typography.bodyFont);

  return (
    <div
      style={{ backgroundColor: tokens.palette.background, fontFamily: bodyFamily }}
      className="flex min-h-full w-full flex-col p-6 sm:p-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 style={{ color: tokens.palette.text, fontFamily: headingFamily }} className="text-[26px] font-[700] tracking-[-0.02em]">
            DASHBOARD
          </h2>
          <p style={{ color: tokens.palette.muted, fontFamily: bodyFamily }} className="mt-1 text-[13px]">
            Polished from low-fi • {tokens.typography.fontPersonality || "art-directed"} • {tokens.palette.primary}
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ borderColor: tokens.palette.border, backgroundColor: tokens.palette.surface, color: tokens.palette.muted, fontFamily: bodyFamily }}
            className="rounded-full border px-3 py-1.5 text-[12px] font-medium hover:brightness-105 hover:border-[#4E1F6E]/20 hover:text-[#4E1F6E]"
          >
            ← Back to prototype
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
          className="rounded-[16px] border p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400" style={{ fontFamily: bodyFamily }}>
              USERS
            </span>
            <span
              style={{ background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.secondary})` }}
              className="flex size-6 items-center justify-center rounded-full text-white shadow-sm group-hover:shadow-[0_0_10px_rgba(78,31,110,0.3)] transition-shadow"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="6" cy="4" r="2" />
                <path d="M2.5 10C2.5 8 4 6.5 6 6.5C8 6.5 9.5 8 9.5 10" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <p style={{ color: tokens.palette.text, fontFamily: headingFamily }} className="mt-3 text-[28px] font-[700] tracking-[-0.02em]">
            128
          </p>
          <p style={{ color: tokens.palette.accent, fontFamily: bodyFamily }} className="mt-1 flex items-center gap-1 text-[12px]">
            <span className="inline-block h-1 w-4 rounded-full bg-[#45A9A9]" />↑ 12% from last week
          </p>
          <div className="mt-4">
            <div className="h-8">
              <svg viewBox="0 0 100 24" className="h-full w-full">
                <path d="M0 18 Q10 12 20 14 T40 10 T60 12 T80 8 T100 10" stroke={tokens.palette.accent} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
          </div>
        </div>

        <div
          style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
          className="rounded-[16px] border p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400" style={{ fontFamily: bodyFamily }}>
              REVENUE
            </span>
            <span
              style={{ backgroundColor: `${tokens.palette.accent}18`, color: tokens.palette.accent }}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span className="text-[12px] font-bold">$</span>
            </span>
          </div>
          <p style={{ color: tokens.palette.text, fontFamily: headingFamily }} className="mt-3 text-[28px] font-[700] tracking-[-0.02em]">
            $4,280
          </p>
          <p style={{ color: tokens.palette.muted, fontFamily: bodyFamily }} className="mt-1 text-[12px]">
            Last 30 days • {tokens.typography.fontPersonality}
          </p>
          <div className="mt-3 flex gap-1">
            <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: tokens.palette.primary }} />
            <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: `${tokens.palette.primary}66` }} />
            <div className="h-1.5 flex-1 rounded-full bg-zinc-100" />
          </div>
        </div>
      </div>

      <div
        style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
        className="mt-4 rounded-[16px] border p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 style={{ color: tokens.palette.text, fontFamily: headingFamily }} className="text-[13px] font-[600]">
            Activity
          </h3>
          <span style={{ color: tokens.palette.accent, fontFamily: bodyFamily }} className="flex items-center gap-1.5 text-[11px]">
            <span className="size-1.5 rounded-full bg-[#45A9A9] animate-pulse shadow-[0_0_6px_rgba(69,169,169,0.5)]" />
            Live • {tokens.typography.fontPersonality}
          </span>
        </div>
        <div className="space-y-3" style={{ fontFamily: bodyFamily }}>
          {[
            { name: "Alex signed up", time: "2m ago", color: tokens.palette.primary },
            { name: "New order #2841", time: "12m ago", color: tokens.palette.accent },
            { name: "Server backup completed", time: "1h ago", color: "#d4d4d8" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[8px] p-1.5 hover:bg-zinc-50 transition-colors">
              <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 text-[13px] text-zinc-700">{item.name}</span>
              <span className="text-[11px] text-zinc-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.secondary})`,
          borderColor: `${tokens.palette.accent}33`,
          fontFamily: tokens.typography.accentFont ? getFontFamilyCss(tokens.typography.accentFont) : bodyFamily,
        }}
        className="mt-6 rounded-[12px] px-4 py-3 text-[12px] leading-[1.5] text-[#f0eef6] border shadow-[0_0_20px_rgba(78,31,110,0.15)]"
      >
        <span className="font-semibold" style={{ color: "#98E8DE" }}>
          Art-directed:
        </span>{" "}
        Typography {tokens.typography.displayFont || tokens.typography.headingFont} + {tokens.typography.bodyFont} • {tokens.typography.fontPersonality} • {tokens.palette.primary} {tokens.palette.accent}
      </div>
    </div>
  );
}

export function PrototypeRenderer({ schema, viewMode, resetKey }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<Screen>("generated");

  useEffect(() => {
    setInputs({});
    setScreen("generated");
  }, [schema, resetKey]);

  const tokens = useDesignTokens(schema);
  const screenPurpose = useMemo(() => inferScreenPurpose(schema.screen.name, schema.screen.components), [schema]);

  // Load fonts efficiently – only fonts actually selected, max 3, non-blocking
  useEffect(() => {
    loadFontsForTypography({
      displayFont: tokens.typography.displayFont,
      headingFont: tokens.typography.headingFont,
      bodyFont: tokens.typography.bodyFont,
      accentFont: tokens.typography.accentFont,
      monoFont: tokens.typography.monoFont,
      fontFamily: tokens.typography.fontFamily,
    });
  }, [tokens.typography]);

  const components = useMemo(() => {
    return [...schema.screen.components].sort((a, b) => a.y - b.y || a.x - b.x);
  }, [schema]);

  const handleInputChange = (id: string, value: string) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleButtonClick = (comp: ButtonComponent) => {
    if (comp.action && comp.action.toLowerCase().includes("dashboard")) {
      setScreen("dashboard");
    } else {
      console.log("[Prototype] Button clicked:", comp.id, comp.action);
    }
  };

  if (screen === "dashboard") {
    return (
      <div
        className={`mx-auto flex w-full flex-1 flex-col bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_40px_rgba(0,0,0,0.08)] ${
          viewMode === "mobile" ? "max-w-[390px] rounded-[24px] overflow-hidden border border-zinc-200" : "max-w-full"
        }`}
      >
        <DashboardScreen onBack={() => setScreen("generated")} tokens={tokens} />
      </div>
    );
  }

  const canvasHeight = viewMode === "mobile" ? 700 : 800;
  const spacingFactor = tokens.layout.spacing === "spacious" ? 1.15 : tokens.layout.spacing === "compact" ? 0.9 : 1;

  const hasHero = components.some((c) => c.type === "image" && c.y < 250 && c.width > 400 && c.height > 150);

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col ${
        viewMode === "mobile"
          ? "max-w-[390px] rounded-[24px] border shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden"
          : "max-w-full"
      }`}
      style={{
        backgroundColor: tokens.palette.background,
        borderColor: tokens.palette.border,
        fontFamily: getFontFamilyCss(tokens.typography.bodyFont, tokens.typography.fontFamily),
      }}
    >
      <div
        className="flex h-11 items-center justify-between border-b px-4 backdrop-blur"
        style={{ borderColor: tokens.palette.border, backgroundColor: `${tokens.palette.surface}CC` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="size-5 rounded-[6px] flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.accent})` }}
          >
            A
          </div>
          <span className="text-[12px] font-[600] tracking-[-0.01em]" style={{ color: tokens.palette.text, fontFamily: getFontFamilyCss(tokens.typography.headingFont) }}>
            {schema.screen.name || "App"}
          </span>
          {tokens.layout.style && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${tokens.palette.accent}15`, color: tokens.palette.accent, fontFamily: getFontFamilyCss(tokens.typography.bodyFont) }}
            >
              {tokens.layout.style}
            </span>
          )}
          {hasHero && <span className="ml-1 rounded-full bg-[#4E1F6E]/10 px-2 py-0.5 text-[10px] text-[#4E1F6E]" style={{ fontFamily: getFontFamilyCss(tokens.typography.bodyFont) }}>Hero polished</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.primary}55` }} />
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.accent}66` }} />
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.accent}33` }} />
        </div>
      </div>

      <div className="relative w-full overflow-auto" style={{ height: canvasHeight, backgroundColor: tokens.palette.background }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(rgba(0,0,0,0.8)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full blur-3xl opacity-20" style={{ background: `radial-gradient(circle, ${tokens.palette.primary}, transparent)` }} />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full blur-3xl opacity-15" style={{ background: `radial-gradient(circle, ${tokens.palette.accent}, transparent)` }} />
        </div>

        {components.map((comp, idx) => {
          const left = clamp((comp.x / 1000) * 100, 0, 90);
          const top = clamp((comp.y / 1000) * 100, 0, 95);
          const width = clamp((comp.width / 1000) * 100, 10, 95);
          const height = clamp((comp.height / 1000) * 100, 4, 60);

          const minWidthPx = comp.type === "heading" || comp.type === "text" ? 120 : 140;
          const minHeightPx = comp.type === "input" || comp.type === "button" ? 44 : 24;

          const isHeroImage = comp.type === "image" && comp.y < 300 && comp.width > 350 && comp.height > 120;
          const isDisplayHeading = idx === 0 && comp.type === "heading";

          return (
            <div
              key={comp.id}
              className="absolute"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                minWidth: `${minWidthPx}px`,
                minHeight: `${minHeightPx}px`,
                transform: `scale(${spacingFactor})`,
                transformOrigin: "top left",
              }}
            >
              {comp.type === "heading" && <GeneratedHeading comp={comp as HeadingComponent} tokens={tokens} isDisplay={isDisplayHeading} />}
              {comp.type === "text" && (
                <GeneratedText comp={comp as TextComponent} tokens={tokens} isAccent={!!(comp as TextComponent).visualHint?.toLowerCase().includes("quote") || !!(comp as TextComponent).visualHint?.toLowerCase().includes("accent")} />
              )}
              {comp.type === "input" && (
                <GeneratedInput
                  comp={comp as InputComponent}
                  value={inputs[comp.id] || ""}
                  onChange={(v) => handleInputChange(comp.id, v)}
                  tokens={tokens}
                />
              )}
              {comp.type === "button" && (
                <GeneratedButton comp={comp as ButtonComponent} onClick={() => handleButtonClick(comp as ButtonComponent)} tokens={tokens} />
              )}
              {comp.type === "card" && <GeneratedCard comp={comp as CardComponent} tokens={tokens} screenPurpose={screenPurpose} />}
              {comp.type === "image" && (
                <GeneratedImage comp={comp as ImageComponent} tokens={tokens} screenPurpose={screenPurpose} isHero={isHeroImage} />
              )}
            </div>
          );
        })}

        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-zinc-400">No components</p>
          </div>
        )}
      </div>

      <div
        className="border-t px-4 py-2 text-[11px] flex items-center justify-between"
        style={{ borderColor: tokens.palette.border, backgroundColor: tokens.palette.surface, color: tokens.palette.muted, fontFamily: getFontFamilyCss(tokens.typography.bodyFont) }}
      >
        <span>
          {components.length} components • {schema.screen.name} • {tokens.layout.alignment} • {tokens.layout.spacing} • {screenPurpose} • {tokens.typography.fontPersonality}
        </span>
        <span className="hidden sm:inline" style={{ color: tokens.palette.accent, fontFamily: tokens.typography.accentFont ? getFontFamilyCss(tokens.typography.accentFont) : undefined }}>
          {tokens.typography.displayFont ? `${tokens.typography.displayFont} + ${tokens.typography.bodyFont}` : `Art-directed • ${tokens.palette.primary}`}
        </span>
      </div>
    </div>
  );
}

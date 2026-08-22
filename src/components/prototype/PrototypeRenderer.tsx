"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo } from "react";
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
} from "@/lib/ui-schema";

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

/* Helpers to use design tokens with fallbacks */
function useDesignTokens(schema: UISchema) {
  const design = schema.screen.design;
  const palette: ColorPalette = design?.colorPalette || {};
  const typography = design?.typography || {};
  const layout = design?.layout || {};

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
      fontFamily: typography.fontFamily || "Inter, ui-sans-system, system-ui, sans-serif",
      headingWeight: typography.headingWeight || 700,
      bodyWeight: typography.bodyWeight || 450,
    },
    layout: {
      alignment: layout.alignment || "left",
      spacing: layout.spacing || "comfortable",
      style: layout.style || "minimal",
    },
  };
}

/* -- Polished primitives – use design tokens when available -- */

function GeneratedHeading({ comp, tokens }: { comp: HeadingComponent; tokens: ReturnType<typeof useDesignTokens> }) {
  const isAllCaps = comp.text === comp.text.toUpperCase() && comp.text.length < 20;
  return (
    <div className="flex h-full w-full items-center">
      <h1
        style={{
          fontFamily: tokens.typography.fontFamily,
          fontWeight: tokens.typography.headingWeight,
          color: tokens.palette.text,
        }}
        className={`w-full text-left tracking-[-0.02em] leading-[1.1] ${
          isAllCaps ? "text-[28px] sm:text-[32px]" : "text-[24px] sm:text-[28px]"
        }`}
      >
        {comp.text}
      </h1>
    </div>
  );
}

function GeneratedText({ comp, tokens }: { comp: TextComponent; tokens: ReturnType<typeof useDesignTokens> }) {
  return (
    <div className="flex h-full w-full items-center">
      <p
        style={{
          fontFamily: tokens.typography.fontFamily,
          fontWeight: tokens.typography.bodyWeight,
          color: tokens.palette.muted,
        }}
        className="w-full text-[14px] leading-[1.6]"
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

  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="group relative w-full">
        <input
          type={isPassword ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label || "Enter text"}
          style={{
            fontFamily: tokens.typography.fontFamily,
            backgroundColor: tokens.palette.surface,
            color: tokens.palette.text,
            borderColor: tokens.palette.border,
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
    comp.action?.toLowerCase().includes("dashboard");

  return (
    <div className="flex h-full w-full items-center">
      <button
        onClick={onClick}
        style={
          isPrimary
            ? {
                backgroundColor: tokens.palette.primary,
                color: "#f0eef6",
                borderColor: tokens.palette.primary,
              }
            : {
                backgroundColor: tokens.palette.surface,
                color: tokens.palette.text,
                borderColor: tokens.palette.border,
              }
        }
        className={`flex h-[44px] w-full items-center justify-center rounded-[12px] border px-5 text-[14px] font-[600] tracking-[-0.01em] transition-all active:scale-[0.98] shadow-sm hover:brightness-110`}
      >
        {comp.text}
      </button>
    </div>
  );
}

function GeneratedCard({ comp, tokens }: { comp: CardComponent; tokens: ReturnType<typeof useDesignTokens> }) {
  return (
    <div className="flex h-full w-full">
      <div
        style={{
          backgroundColor: tokens.palette.surface,
          borderColor: tokens.palette.border,
        }}
        className="flex w-full flex-col rounded-[16px] border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all"
      >
        <div
          className="mb-2 h-2 w-8 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${tokens.palette.primary}22, ${tokens.palette.accent}22)`,
          }}
        />
        <p style={{ color: tokens.palette.text, fontFamily: tokens.typography.fontFamily }} className="text-[13px] font-[500]">
          {comp.text || "Card content"}
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-zinc-100" />
          <div className="h-2 w-2/3 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

function GeneratedImage({ comp, tokens }: { comp: ImageComponent; tokens: ReturnType<typeof useDesignTokens> }) {
  return (
    <div className="flex h-full w-full">
      <div
        style={{
          borderColor: tokens.palette.border,
          backgroundColor: `${tokens.palette.accent}0D`,
          color: tokens.palette.muted,
        }}
        className="flex w-full items-center justify-center rounded-[14px] border border-dashed hover:border-[#45A9A9]/30 transition-colors"
      >
        <div className="flex flex-col items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="2" y="3" width="16" height="13" rx="3" />
            <circle cx="7" cy="7.5" r="1.5" />
            <path d="M3 14L7 9L11 13L14.5 10L18 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] tracking-wide">{comp.alt || "Image"}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ onBack, tokens }: { onBack?: () => void; tokens: ReturnType<typeof useDesignTokens> }) {
  return (
    <div
      style={{ backgroundColor: tokens.palette.background, fontFamily: tokens.typography.fontFamily }}
      className="flex min-h-full w-full flex-col p-6 sm:p-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 style={{ color: tokens.palette.text }} className="text-[26px] font-[700] tracking-[-0.02em]">
            DASHBOARD
          </h2>
          <p style={{ color: tokens.palette.muted }} className="mt-1 text-[13px]">
            Welcome back — polished from low-fi sketch
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ borderColor: tokens.palette.border, backgroundColor: tokens.palette.surface, color: tokens.palette.muted }}
            className="rounded-full border px-3 py-1.5 text-[12px] font-medium hover:brightness-105"
          >
            ← Back to prototype
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
          className="rounded-[16px] border p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400">USERS</span>
            <span
              style={{ background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.secondary})` }}
              className="flex size-6 items-center justify-center rounded-full text-white"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="6" cy="4" r="2" />
                <path d="M2.5 10C2.5 8 4 6.5 6 6.5C8 6.5 9.5 8 9.5 10" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <p style={{ color: tokens.palette.text }} className="mt-3 text-[28px] font-[700] tracking-[-0.02em]">
            128
          </p>
          <p style={{ color: tokens.palette.accent }} className="mt-1 text-[12px]">
            ↑ 12% from last week
          </p>
        </div>

        <div
          style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
          className="rounded-[16px] border p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400">REVENUE</span>
            <span
              style={{ backgroundColor: `${tokens.palette.accent}22`, color: tokens.palette.accent }}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span className="text-[12px] font-bold">$</span>
            </span>
          </div>
          <p style={{ color: tokens.palette.text }} className="mt-3 text-[28px] font-[700] tracking-[-0.02em]">
            $4,280
          </p>
          <p style={{ color: tokens.palette.muted }} className="mt-1 text-[12px]">
            Last 30 days
          </p>
        </div>
      </div>

      <div
        style={{ backgroundColor: tokens.palette.surface, borderColor: tokens.palette.border }}
        className="mt-4 rounded-[16px] border p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 style={{ color: tokens.palette.text }} className="text-[13px] font-[600]">
            Activity
          </h3>
          <span style={{ color: tokens.palette.accent }} className="flex items-center gap-1.5 text-[11px]">
            <span className="size-1.5 rounded-full bg-[#45A9A9] animate-pulse shadow-[0_0_6px_rgba(69,169,169,0.5)]" />
            Live
          </span>
        </div>
        <div className="space-y-3">
          {[
            { name: "Alex signed up", time: "2m ago", color: tokens.palette.primary },
            { name: "New order #2841", time: "12m ago", color: tokens.palette.accent },
            { name: "Server backup completed", time: "1h ago", color: "#d4d4d8" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
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
        }}
        className="mt-6 rounded-[12px] px-4 py-3 text-[12px] leading-[1.5] text-[#f0eef6] border"
      >
        <span className="font-semibold" style={{ color: "#98E8DE" }}>
          Polished:
        </span>{" "}
        This dashboard uses the AI-inferred color palette, typography, and spacing from your low-fi sketch.
      </div>
    </div>
  );
}

export function PrototypeRenderer({ schema, viewMode, resetKey }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<Screen>("generated");

  React.useEffect(() => {
    setInputs({});
    setScreen("generated");
  }, [schema, resetKey]);

  const tokens = useDesignTokens(schema);

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

  // Spacing inference: comfortable vs compact affects gap
  const spacingFactor = tokens.layout.spacing === "spacious" ? 1.2 : tokens.layout.spacing === "compact" ? 0.85 : 1;

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
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <div
        className="flex h-11 items-center justify-between border-b px-4 backdrop-blur"
        style={{ borderColor: tokens.palette.border, backgroundColor: `${tokens.palette.surface}CC` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="size-5 rounded-[6px] flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${tokens.palette.primary}, ${tokens.palette.accent})` }}
          >
            A
          </div>
          <span className="text-[12px] font-[600] tracking-[-0.01em]" style={{ color: tokens.palette.text }}>
            {schema.screen.name || "App"}
          </span>
          {tokens.layout.style && (
            <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${tokens.palette.accent}15`, color: tokens.palette.accent }}>
              {tokens.layout.style}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.primary}55` }} />
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.accent}66` }} />
          <div className="size-1.5 rounded-full" style={{ backgroundColor: `${tokens.palette.accent}33` }} />
        </div>
      </div>

      <div className="relative w-full overflow-auto" style={{ height: canvasHeight, backgroundColor: tokens.palette.background }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(rgba(0,0,0,0.8)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {components.map((comp) => {
          const left = clamp((comp.x / 1000) * 100, 0, 90);
          const top = clamp((comp.y / 1000) * 100, 0, 95);
          const width = clamp((comp.width / 1000) * 100, 10, 95);
          const height = clamp((comp.height / 1000) * 100, 4, 60);

          const minWidthPx = comp.type === "heading" || comp.type === "text" ? 120 : 140;
          const minHeightPx = comp.type === "input" || comp.type === "button" ? 44 : 24;

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
                // Apply spacing factor for polished rhythm
                transform: `scale(${spacingFactor})`,
                transformOrigin: "top left",
              }}
            >
              {comp.type === "heading" && <GeneratedHeading comp={comp as HeadingComponent} tokens={tokens} />}
              {comp.type === "text" && <GeneratedText comp={comp as TextComponent} tokens={tokens} />}
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
              {comp.type === "card" && <GeneratedCard comp={comp as CardComponent} tokens={tokens} />}
              {comp.type === "image" && <GeneratedImage comp={comp as ImageComponent} tokens={tokens} />}
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
        style={{ borderColor: tokens.palette.border, backgroundColor: tokens.palette.surface, color: tokens.palette.muted }}
      >
        <span>
          {components.length} components • {schema.screen.name} • {tokens.layout.alignment} • {tokens.layout.spacing}
        </span>
        <span className="hidden sm:inline" style={{ color: tokens.palette.accent }}>
          Polished high-fidelity • {tokens.palette.primary} {tokens.palette.accent}
        </span>
      </div>
    </div>
  );
}

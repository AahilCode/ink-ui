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

function GeneratedHeading({ comp }: { comp: HeadingComponent }) {
  const isAllCaps = comp.text === comp.text.toUpperCase() && comp.text.length < 20;
  return (
    <div className="flex h-full w-full items-center">
      <h1
        className={`w-full text-left font-[700] tracking-[-0.02em] text-zinc-900 leading-[1.1] ${
          isAllCaps ? "text-[28px] sm:text-[32px]" : "text-[24px] sm:text-[28px]"
        }`}
      >
        {comp.text}
      </h1>
    </div>
  );
}

function GeneratedText({ comp }: { comp: TextComponent }) {
  return (
    <div className="flex h-full w-full items-center">
      <p className="w-full text-[14px] leading-[1.5] text-zinc-600">{comp.text}</p>
    </div>
  );
}

function GeneratedInput({
  comp,
  value,
  onChange,
}: {
  comp: InputComponent;
  value: string;
  onChange: (v: string) => void;
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
          className="h-[44px] w-full rounded-[12px] border border-zinc-200 bg-white px-4 text-[14px] font-[450] text-zinc-900 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#4E1F6E] focus:ring-[3px] focus:ring-[#4E1F6E]/15"
        />
      </div>
    </div>
  );
}

function GeneratedButton({ comp, onClick }: { comp: ButtonComponent; onClick: () => void }) {
  const isPrimary =
    comp.text.toLowerCase().includes("sign in") ||
    comp.text.toLowerCase().includes("login") ||
    comp.text.toLowerCase().includes("continue") ||
    comp.action?.toLowerCase().includes("dashboard");

  return (
    <div className="flex h-full w-full items-center">
      <button
        onClick={onClick}
        className={`flex h-[44px] w-full items-center justify-center rounded-[12px] px-5 text-[14px] font-[600] tracking-[-0.01em] transition-all active:scale-[0.98] ${
          isPrimary
            ? "bg-[#4E1F6E] text-[#f0eef6] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(78,31,110,0.2)_inset,0_0_12px_rgba(78,31,110,0.25)] hover:bg-[#5e2585] active:bg-[#3d1856]"
            : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 shadow-sm hover:border-[#45A9A9]/30 hover:text-[#3E3E75]"
        }`}
      >
        {comp.text}
      </button>
    </div>
  );
}

function GeneratedCard({ comp }: { comp: CardComponent }) {
  return (
    <div className="flex h-full w-full">
      <div className="flex w-full flex-col rounded-[16px] border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#45A9A9]/20 transition-colors">
        <div className="mb-2 h-2 w-8 rounded-full bg-gradient-to-r from-[#4E1F6E]/20 to-[#45A9A9]/20" />
        <p className="text-[13px] font-[500] text-zinc-900">{comp.text || "Card content"}</p>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-zinc-100" />
          <div className="h-2 w-2/3 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

function GeneratedImage({ comp }: { comp: ImageComponent }) {
  return (
    <div className="flex h-full w-full">
      <div className="flex w-full items-center justify-center rounded-[14px] border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 hover:border-[#45A9A9]/30 hover:text-[#45A9A9]/60 transition-colors">
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

function DashboardScreen({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex min-h-full w-full flex-col bg-[#fcfcfd] p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-zinc-900">DASHBOARD</h2>
          <p className="mt-1 text-[13px] text-zinc-500">Welcome back — prototype navigation demo</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 hover:border-[#4E1F6E]/20 hover:text-[#4E1F6E]"
          >
            ← Back to prototype
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[16px] border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#4E1F6E]/15 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400">USERS</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4E1F6E] to-[#3E3E75] text-[#f0eef6]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="6" cy="4" r="2" />
                <path d="M2.5 10C2.5 8 4 6.5 6 6.5C8 6.5 9.5 8 9.5 10" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-[28px] font-[700] tracking-[-0.02em] text-zinc-900">128</p>
          <p className="mt-1 text-[12px] text-[#45A9A9]">↑ 12% from last week</p>
        </div>

        <div className="rounded-[16px] border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#45A9A9]/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400">REVENUE</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-[#45A9A9]/15 text-[#45A9A9]">
              <span className="text-[12px] font-bold">$</span>
            </span>
          </div>
          <p className="mt-3 text-[28px] font-[700] tracking-[-0.02em] text-zinc-900">$4,280</p>
          <p className="mt-1 text-[12px] text-zinc-500">Last 30 days</p>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-[600] text-zinc-900">Activity</h3>
          <span className="flex items-center gap-1.5 text-[11px] text-[#45A9A9]">
            <span className="size-1.5 rounded-full bg-[#45A9A9] animate-pulse shadow-[0_0_6px_rgba(69,169,169,0.5)]" />
            Live
          </span>
        </div>
        <div className="space-y-3">
          {[
            { name: "Alex signed up", time: "2m ago", color: "bg-[#4E1F6E]" },
            { name: "New order #2841", time: "12m ago", color: "bg-[#45A9A9]" },
            { name: "Server backup completed", time: "1h ago", color: "bg-zinc-300" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`size-2 rounded-full ${item.color}`} />
              <span className="flex-1 text-[13px] text-zinc-700">{item.name}</span>
              <span className="text-[11px] text-zinc-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[12px] bg-gradient-to-r from-[#4E1F6E] to-[#3E3E75] px-4 py-3 text-[12px] leading-[1.5] text-[#f0eef6] border border-[#98E8DE]/20">
        <span className="font-semibold text-[#98E8DE]">Demo:</span> This dashboard proves button actions work. Clicking <span className="font-mono text-[#f0eef6]">SIGN IN → dashboard</span> triggers navigation.
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
        <DashboardScreen onBack={() => setScreen("generated")} />
      </div>
    );
  }

  const canvasHeight = viewMode === "mobile" ? 700 : 800;

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col bg-[#fcfcfd] ${
        viewMode === "mobile"
          ? "max-w-[390px] rounded-[24px] border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden"
          : "max-w-full"
      }`}
    >
      <div className="flex h-11 items-center justify-between border-b border-zinc-100 bg-white/80 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-[6px] bg-gradient-to-br from-[#4E1F6E] to-[#45A9A9] flex items-center justify-center text-[9px] font-bold text-white">A</div>
          <span className="text-[12px] font-[600] tracking-[-0.01em] text-zinc-700">{schema.screen.name || "App"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-[#4E1F6E]/30" />
          <div className="size-1.5 rounded-full bg-[#45A9A9]/40" />
          <div className="size-1.5 rounded-full bg-[#98E8DE]/50" />
        </div>
      </div>

      <div className="relative w-full overflow-auto bg-[#fcfcfd]" style={{ height: canvasHeight }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(rgba(0,0,0,0.8)_1px,transparent_1px)] bg-[size:20px_20px]" />

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
              }}
            >
              {comp.type === "heading" && <GeneratedHeading comp={comp as HeadingComponent} />}
              {comp.type === "text" && <GeneratedText comp={comp as TextComponent} />}
              {comp.type === "input" && (
                <GeneratedInput
                  comp={comp as InputComponent}
                  value={inputs[comp.id] || ""}
                  onChange={(v) => handleInputChange(comp.id, v)}
                />
              )}
              {comp.type === "button" && (
                <GeneratedButton comp={comp as ButtonComponent} onClick={() => handleButtonClick(comp as ButtonComponent)} />
              )}
              {comp.type === "card" && <GeneratedCard comp={comp as CardComponent} />}
              {comp.type === "image" && <GeneratedImage comp={comp as ImageComponent} />}
            </div>
          );
        })}

        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-zinc-400">No components</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 bg-white px-4 py-2 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>{components.length} components • {schema.screen.name}</span>
        <span className="hidden sm:inline text-[#45A9A9]">Inputs live • Buttons → dashboard</span>
      </div>
    </div>
  );
}

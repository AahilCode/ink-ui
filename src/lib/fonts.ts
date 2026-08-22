/**
 * Intelligent font personality system for INK UI
 * Maps font personalities to web-safe and Google Fonts, loads efficiently
 */

export type FontPersonality =
  | "modern geometric sans"
  | "clean professional sans"
  | "elegant serif"
  | "luxury editorial serif"
  | "handwritten"
  | "script calligraphic"
  | "rounded friendly"
  | "bold display"
  | "condensed display"
  | "editorial magazine"
  | "minimalist"
  | "monospace technical"
  | "playful"
  | "futuristic";

export interface FontOption {
  name: string; // display name used in schema
  family: string; // CSS font-family string
  google?: string; // Google Fonts family param if needed
  category: FontPersonality;
  weights?: string; // e.g., "400;600;700"
  isDecorative?: boolean; // handwritten/script/display – not for body
}

export const FONT_LIBRARY: FontOption[] = [
  // Modern geometric sans
  { name: "Outfit", family: "'Outfit', sans-serif", google: "Outfit", category: "modern geometric sans", weights: "400;600;700" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif", google: "Space Grotesk", category: "modern geometric sans", weights: "400;600;700" },
  { name: "Sora", family: "'Sora', sans-serif", google: "Sora", category: "modern geometric sans", weights: "400;600;700" },
  { name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", google: "Plus Jakarta Sans", category: "modern geometric sans", weights: "400;600;700" },

  // Clean professional sans
  { name: "Inter", family: "'Inter', sans-serif", google: "Inter", category: "clean professional sans", weights: "400;500;600;700" },
  { name: "Work Sans", family: "'Work Sans', sans-serif", google: "Work Sans", category: "clean professional sans", weights: "400;500;600;700" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif", google: "IBM Plex Sans", category: "clean professional sans", weights: "400;500;600" },

  // Elegant serif
  { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair Display", category: "elegant serif", weights: "400;600;700", isDecorative: false },
  { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", google: "Cormorant Garamond", category: "elegant serif", weights: "400;600;700" },
  { name: "Fraunces", family: "'Fraunces', serif", google: "Fraunces", category: "elegant serif", weights: "400;600;700" },

  // Luxury editorial serif
  { name: "Bodoni Moda", family: "'Bodoni Moda', serif", google: "Bodoni Moda", category: "luxury editorial serif", weights: "400;600;700" },
  { name: "Libre Baskerville", family: "'Libre Baskerville', serif", google: "Libre Baskerville", category: "luxury editorial serif", weights: "400;700" },
  { name: "Cormorant", family: "'Cormorant', serif", google: "Cormorant", category: "luxury editorial serif", weights: "400;600;700" },

  // Handwritten
  { name: "Caveat", family: "'Caveat', cursive", google: "Caveat", category: "handwritten", weights: "400;600", isDecorative: true },
  { name: "Patrick Hand", family: "'Patrick Hand', cursive", google: "Patrick Hand", category: "handwritten", weights: "400", isDecorative: true },
  { name: "Kalam", family: "'Kalam', cursive", google: "Kalam", category: "handwritten", weights: "400;700", isDecorative: true },

  // Script/calligraphic
  { name: "Dancing Script", family: "'Dancing Script', cursive", google: "Dancing Script", category: "script calligraphic", weights: "400;600;700", isDecorative: true },
  { name: "Great Vibes", family: "'Great Vibes', cursive", google: "Great Vibes", category: "script calligraphic", weights: "400", isDecorative: true },
  { name: "Allura", family: "'Allura', cursive", google: "Allura", category: "script calligraphic", weights: "400", isDecorative: true },

  // Rounded/friendly
  { name: "Nunito", family: "'Nunito', sans-serif", google: "Nunito", category: "rounded friendly", weights: "400;600;700" },
  { name: "Poppins", family: "'Poppins', sans-serif", google: "Poppins", category: "rounded friendly", weights: "400;600;700" },
  { name: "Quicksand", family: "'Quicksand', sans-serif", google: "Quicksand", category: "rounded friendly", weights: "400;600;700" },
  { name: "Comfortaa", family: "'Comfortaa', sans-serif", google: "Comfortaa", category: "rounded friendly", weights: "400;600;700" },

  // Bold display
  { name: "Anton", family: "'Anton', sans-serif", google: "Anton", category: "bold display", weights: "400", isDecorative: true },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif", google: "Bebas Neue", category: "bold display", weights: "400", isDecorative: true },
  { name: "Oswald", family: "'Oswald', sans-serif", google: "Oswald", category: "bold display", weights: "400;600;700" },
  { name: "Russo One", family: "'Russo One', sans-serif", google: "Russo One", category: "bold display", weights: "400", isDecorative: true },

  // Condensed/display
  { name: "Barlow Condensed", family: "'Barlow Condensed', sans-serif", google: "Barlow Condensed", category: "condensed display", weights: "400;600;700" },

  // Editorial magazine
  { name: "Lora", family: "'Lora', serif", google: "Lora", category: "editorial magazine", weights: "400;600;700" },
  { name: "Merriweather", family: "'Merriweather', serif", google: "Merriweather", category: "editorial magazine", weights: "400;700" },
  { name: "Newsreader", family: "'Newsreader', serif", google: "Newsreader", category: "editorial magazine", weights: "400;600;700" },

  // Minimalist
  { name: "Manrope", family: "'Manrope', sans-serif", google: "Manrope", category: "minimalist", weights: "400;600;700" },

  // Monospace/technical
  { name: "JetBrains Mono", family: "'JetBrains Mono', monospace", google: "JetBrains Mono", category: "monospace technical", weights: "400;600" },
  { name: "Fira Code", family: "'Fira Code', monospace", google: "Fira Code", category: "monospace technical", weights: "400;600" },
  { name: "IBM Plex Mono", family: "'IBM Plex Mono', monospace", google: "IBM Plex Mono", category: "monospace technical", weights: "400;600" },
  { name: "Space Mono", family: "'Space Mono', monospace", google: "Space Mono", category: "monospace technical", weights: "400;700" },

  // Playful
  { name: "Fredoka", family: "'Fredoka', sans-serif", google: "Fredoka", category: "playful", weights: "400;600;700" },
  { name: "Baloo 2", family: "'Baloo 2', sans-serif", google: "Baloo 2", category: "playful", weights: "400;600;700" },

  // Futuristic
  { name: "Orbitron", family: "'Orbitron', sans-serif", google: "Orbitron", category: "futuristic", weights: "400;600;700", isDecorative: true },
  { name: "Rajdhani", family: "'Rajdhani', sans-serif", google: "Rajdhani", category: "futuristic", weights: "400;600;700" },
  { name: "Exo 2", family: "'Exo 2', sans-serif", google: "Exo 2", category: "futuristic", weights: "400;600;700" },
];

// Map font name → FontOption for quick lookup
const fontMap = new Map<string, FontOption>();
for (const f of FONT_LIBRARY) {
  fontMap.set(f.name.toLowerCase(), f);
  // Also allow family string lookup
  fontMap.set(f.family.toLowerCase(), f);
}

// Track loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

function isGoogleFontNeeded(fontName: string): FontOption | undefined {
  if (!fontName) return undefined;
  const lower = fontName.toLowerCase();
  if (fontMap.has(lower)) return fontMap.get(lower);
  for (const opt of fontMap.values()) {
    if (lower.includes(opt.name.toLowerCase())) {
      return opt;
    }
  }
  return undefined;
}

function buildGoogleFontsUrl(fonts: FontOption[]): string {
  // Build URL like https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=...
  const families = fonts
    .filter((f) => f.google)
    .map((f) => {
      const name = f.google!.replace(/ /g, "+");
      const weights = f.weights ? `:wght@${f.weights.replace(/;/g, ";")}` : "";
      return `family=${name}${weights}`;
    })
    .join("&");

  if (!families) return "";
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function loadFontsForTypography(typography: {
  displayFont?: string;
  headingFont?: string;
  bodyFont?: string;
  accentFont?: string;
  monoFont?: string;
  fontFamily?: string;
}): void {
  if (typeof document === "undefined") return;

  const fontsToLoad: FontOption[] = [];
  const seen = new Set<string>();

  const candidates = [
    typography.displayFont,
    typography.headingFont,
    typography.bodyFont,
    typography.accentFont,
    typography.monoFont,
    typography.fontFamily,
  ].filter(Boolean) as string[];

  // Max 3 font families per design – enforce limit
  const uniqueCandidates = Array.from(new Set(candidates)).slice(0, 3);

  for (const name of uniqueCandidates) {
    const opt = isGoogleFontNeeded(name);
    if (opt && opt.google && !loadedFonts.has(opt.name) && !seen.has(opt.name)) {
      fontsToLoad.push(opt);
      seen.add(opt.name);
    }
  }

  if (fontsToLoad.length === 0) return;

  const url = buildGoogleFontsUrl(fontsToLoad);
  if (!url) return;

  // Avoid duplicate link
  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) {
    fontsToLoad.forEach((f) => loadedFonts.add(f.name));
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.onload = () => {
    fontsToLoad.forEach((f) => loadedFonts.add(f.name));
  };
  document.head.appendChild(link);
}

export function getFontFamilyCss(fontName?: string, fallback?: string): string {
  if (!fontName) return fallback || "Inter, ui-sans-system, system-ui, sans-serif";
  const opt = isGoogleFontNeeded(fontName);
  if (opt) return opt.family;
  // If already a CSS family string, return as is
  if (fontName.includes(",") || fontName.includes("'") || fontName.includes('"')) {
    return fontName;
  }
  // Otherwise treat as name and add fallback
  return `'${fontName}', ${fallback || "sans-serif"}`;
}

export function isDecorativeFont(fontName?: string): boolean {
  if (!fontName) return false;
  const opt = isGoogleFontNeeded(fontName);
  return !!opt?.isDecorative;
}

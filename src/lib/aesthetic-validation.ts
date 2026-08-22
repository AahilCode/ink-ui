/**
 * Aesthetic Intelligence Engine for INK UI
 * Evaluates generated interface as complete composition and improves visual quality
 * Preserve idea, improve execution
 */

import type { UIScreen, UIComponent, ColorPalette, DesignSystem } from "./ui-schema";

const SPACING_SCALE = [8, 12, 16, 24, 32, 48, 64, 96];
const GAP = 20; // minimum gap for feature preservation restore

function snapToSpacingScale(value: number): number {
  let closest = SPACING_SCALE[0];
  let minDiff = Math.abs(value - closest);
  for (const s of SPACING_SCALE) {
    const diff = Math.abs(value - s);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
}

function inferProductPersonality(name: string, components: UIComponent[]): string {
  const lower = name.toLowerCase();
  const text = components.map((c) => ("text" in c ? (c as { text?: string }).text : "")).join(" ").toLowerCase();
  const combined = `${lower} ${text}`;

  if (combined.includes("luxury") || combined.includes("fashion") || combined.includes("jewelry") || combined.includes("wedding") || combined.includes("premium") || combined.includes("royal")) return "luxury";
  if (combined.includes("finance") || combined.includes("bank") || combined.includes("money") || combined.includes("invest")) return "professional";
  if (combined.includes("play") || combined.includes("game") || combined.includes("fun") || combined.includes("kids")) return "playful";
  if (combined.includes("portfolio") || combined.includes("art") || combined.includes("creative") || combined.includes("gallery")) return "editorial";
  if (combined.includes("education") || combined.includes("learn") || combined.includes("friendly") || combined.includes("care")) return "friendly";
  if (combined.includes("saas") || combined.includes("dashboard") || combined.includes("analytics") || combined.includes("tech") || combined.includes("admin")) return "professional";
  if (combined.includes("minimal") || combined.includes("login")) return "minimalist";
  if (combined.includes("brutal") || combined.includes("raw")) return "brutalist";
  return "professional";
}

function getBorderRadiusForPersonality(personality: string): { base: string; card: string; button: string; input: string; style: string } {
  switch (personality) {
    case "luxury":
      return { base: "8px", card: "12px", button: "8px", input: "8px", style: "subtle" };
    case "friendly":
      return { base: "16px", card: "20px", button: "14px", input: "14px", style: "large rounded" };
    case "playful":
      return { base: "24px", card: "24px", button: "20px", input: "16px", style: "highly rounded" };
    case "brutalist":
      return { base: "2px", card: "4px", button: "2px", input: "2px", style: "minimal" };
    case "editorial":
      return { base: "12px", card: "16px", button: "10px", input: "10px", style: "editorial" };
    case "minimalist":
      return { base: "10px", card: "12px", button: "10px", input: "10px", style: "minimal" };
    case "professional":
    default:
      return { base: "12px", card: "16px", button: "12px", input: "12px", style: "moderate" };
  }
}

function getDepthForPersonality(personality: string): { style: string; card: string; elevated: string; background: string } {
  switch (personality) {
    case "luxury":
      return { style: "elevated cards with subtle borders", card: "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)", elevated: "0 8px 32px rgba(0,0,0,0.08)", background: "subtle layered" };
    case "friendly":
      return { style: "soft shadows, friendly depth", card: "0 2px 12px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)", elevated: "0 6px 20px rgba(0,0,0,0.06)", background: "soft" };
    case "playful":
      return { style: "elevated with depth, playful shadows", card: "0 6px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)", elevated: "0 10px 32px rgba(0,0,0,0.10)", background: "layered" };
    case "brutalist":
      return { style: "flat surfaces, minimal depth", card: "none", elevated: "none", background: "flat" };
    case "professional":
    default:
      return { style: "subtle borders, soft shadows", card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)", elevated: "0 4px 16px rgba(0,0,0,0.06)", background: "subtle" };
  }
}

interface AestheticScore {
  hierarchy: number;
  whitespace: number;
  rhythm: number;
  alignment: number;
  contrast: number;
  consistency: number;
  composition: number;
  typography: number;
  density: number;
  overall: number;
}

function calculateAestheticScore(screen: UIScreen): AestheticScore {
  const comps = screen.components;
  const hasHeading = comps.some((c) => c.type === "heading");
  const headingCount = comps.filter((c) => c.type === "heading").length;
  const buttonCount = comps.filter((c) => c.type === "button").length;
  const primaryButtons = comps.filter(
    (c) =>
      c.type === "button" &&
      ((c as { variant?: string }).variant === "primary" ||
        (c as { text?: string }).text?.toLowerCase().includes("sign") ||
        (c as { text?: string }).text?.toLowerCase().includes("login"))
  ).length;

  // Hierarchy: should have clear primary focal, not 10 competing
  let hierarchy = 80;
  if (!hasHeading) hierarchy -= 20;
  if (headingCount > 3) hierarchy -= (headingCount - 3) * 10;
  if (buttonCount > 0 && primaryButtons === 0) hierarchy -= 10;
  if (buttonCount > 1 && primaryButtons > 1) hierarchy -= 10; // every button looking primary
  hierarchy = Math.max(0, Math.min(100, hierarchy));

  // Whitespace: check crowded regions – average gap
  const sortedY = [...comps].sort((a, b) => a.y - b.y);
  let totalGap = 0;
  let crowdedCount = 0;
  for (let i = 1; i < sortedY.length; i++) {
    const gap = sortedY[i].y - (sortedY[i - 1].y + sortedY[i - 1].height);
    totalGap += gap;
    if (gap < 12) crowdedCount++;
  }
  const avgGap = sortedY.length > 1 ? totalGap / (sortedY.length - 1) : 32;
  let whitespace = 80;
  if (avgGap < 12) whitespace -= 30;
  else if (avgGap < 20) whitespace -= 10;
  else if (avgGap > 96) whitespace -= 10;
  if (crowdedCount > 0) whitespace -= crowdedCount * 5;
  whitespace = Math.max(0, Math.min(100, whitespace));

  // Rhythm: check if gaps are from spacing scale
  let rhythm = 80;
  let irregularGaps = 0;
  for (let i = 1; i < sortedY.length; i++) {
    const gap = sortedY[i].y - (sortedY[i - 1].y + sortedY[i - 1].height);
    const snapped = snapToSpacingScale(gap);
    if (Math.abs(gap - snapped) > 6) irregularGaps++;
  }
  rhythm -= irregularGaps * 8;
  rhythm = Math.max(0, Math.min(100, rhythm));

  // Alignment: check left edges alignment for related elements
  const leftEdges = comps.map((c) => c.x);
  const uniqueLeft = new Set(leftEdges.map((x) => Math.round(x / 10) * 10));
  let alignment = 80;
  if (uniqueLeft.size > 4) alignment -= (uniqueLeft.size - 4) * 5;
  // Form fields should have consistent widths
  const inputs = comps.filter((c) => c.type === "input");
  if (inputs.length > 1) {
    const widths = new Set(inputs.map((c) => c.width));
    if (widths.size > 1) alignment -= 10;
    const xs = new Set(inputs.map((c) => c.x));
    if (xs.size > 1) alignment -= 15;
  }
  alignment = Math.max(0, Math.min(100, alignment));

  // Contrast: check primary vs secondary, not every button primary, etc.
  let contrast = 80;
  if (buttonCount > 2 && primaryButtons === buttonCount) contrast -= 20;
  // Check if design has colors
  const palette = screen.design?.colorPalette;
  if (!palette || !palette.primary) contrast -= 10;
  contrast = Math.max(0, Math.min(100, contrast));

  // Consistency: repeated components same radius, etc – assume good if same type same dimensions
  let consistency = 80;
  const cardWidths = comps.filter((c) => c.type === "card").map((c) => c.width);
  if (cardWidths.length > 1) {
    const uniqueCardWidths = new Set(cardWidths);
    if (uniqueCardWidths.size > 2) consistency -= 15;
  }
  const buttonHeights = comps.filter((c) => c.type === "button").map((c) => c.height);
  if (buttonHeights.length > 1) {
    const unique = new Set(buttonHeights);
    if (unique.size > 1) consistency -= 10;
  }
  consistency = Math.max(0, Math.min(100, consistency));

  // Composition: check balance – is content centered? one side heavy? hero focal clear?
  let composition = 80;
  const avgX = comps.reduce((sum, c) => sum + c.x + c.width / 2, 0) / comps.length;
  // Ideal center is 500
  const centerDeviation = Math.abs(avgX - 500);
  if (centerDeviation > 200) composition -= 15;
  // Check if hero exists for landing
  const isLanding = screen.name.toLowerCase().includes("landing") || screen.name.toLowerCase().includes("home");
  if (isLanding) {
    const hasLargeImage = comps.some((c) => c.type === "image" && c.width > 500 && c.height > 200);
    if (!hasLargeImage) composition -= 10;
  }
  composition = Math.max(0, Math.min(100, composition));

  // Typography: check if font personality exists and hierarchy distinct
  let typography = 80;
  const typo = screen.design?.typography;
  if (!typo || (!typo.displayFont && !typo.headingFont && !typo.fontFamily)) typography -= 20;
  if (typo?.fontPersonality) typography += 5;
  if (headingCount > 1) {
    // Check if headings have distinct sizes? We can't know size, but assume if multiple headings same height, less hierarchy
    const headingHeights = comps.filter((c) => c.type === "heading").map((c) => c.height);
    const uniqueHeights = new Set(headingHeights);
    if (uniqueHeights.size === 1 && headingCount > 1) typography -= 10;
  }
  typography = Math.max(0, Math.min(100, typography));

  // Density: evaluate too empty/balanced/too dense
  let density = 80;
  const totalArea = comps.reduce((sum, c) => sum + c.width * c.height, 0);
  const canvasArea = 1000 * 1000;
  const coverage = totalArea / canvasArea;
  if (coverage < 0.15) density -= 20; // too empty
  else if (coverage > 0.6) density -= 20; // too dense
  else if (coverage > 0.45) density -= 10;
  density = Math.max(0, Math.min(100, density));

  const overall = Math.round(
    (hierarchy + whitespace + rhythm + alignment + contrast + consistency + composition + typography + density) / 9
  );

  return {
    hierarchy,
    whitespace,
    rhythm,
    alignment,
    contrast,
    consistency,
    composition,
    typography,
    density,
    overall,
  };
}

interface CritiqueResult {
  question: string;
  answer: boolean;
  improvement?: string;
}

function aestheticCritique(screen: UIScreen, score: AestheticScore): CritiqueResult[] {
  const results: CritiqueResult[] = [];

  const comps = screen.components;
  const primaryFocal = comps.filter((c) => c.type === "heading").sort((a, b) => a.y - b.y)[0];
  const primaryCTA = comps
    .filter((c) => c.type === "button")
    .find(
      (c) =>
        (c as { text?: string }).text?.toLowerCase().includes("sign") ||
        (c as { action?: string }).action?.toLowerCase().includes("dashboard")
    );

  results.push({
    question: "What is the first thing the user should notice?",
    answer: !!primaryFocal,
    improvement: !primaryFocal ? "Add clear primary heading as focal point" : undefined,
  });

  results.push({
    question: "Is that actually the strongest visual element?",
    answer: score.hierarchy > 60,
    improvement: score.hierarchy <= 60 ? "Increase size/weight/contrast of primary focal point" : undefined,
  });

  results.push({
    question: "Is the primary CTA obvious?",
    answer: !!primaryCTA && score.contrast > 60,
    improvement: !primaryCTA ? "Ensure primary CTA button exists and is visually distinct" : undefined,
  });

  results.push({
    question: "Are related elements grouped?",
    answer: score.alignment > 60,
    improvement: score.alignment <= 60 ? "Group related elements, align to grid" : undefined,
  });

  results.push({
    question: "Is there enough whitespace?",
    answer: score.whitespace > 60,
    improvement: score.whitespace <= 60 ? "Increase whitespace around crowded regions" : undefined,
  });

  results.push({
    question: "Is anything unnecessarily crowded?",
    answer: score.density > 50 && score.whitespace > 50,
    improvement: score.density <= 50 ? "Reduce density, increase gaps" : undefined,
  });

  results.push({
    question: "Are components aligned?",
    answer: score.alignment > 60,
    improvement: score.alignment <= 60 ? "Align to consistent grid, same left edges for related elements" : undefined,
  });

  results.push({
    question: "Are repeated components consistent?",
    answer: score.consistency > 60,
    improvement: score.consistency <= 60 ? "Make repeated components share same radius, border, padding, typography" : undefined,
  });

  results.push({
    question: "Is the color hierarchy clear?",
    answer: score.contrast > 60,
    improvement: score.contrast <= 60 ? "Establish clear contrast hierarchy: primary highest, secondary moderate, muted supporting" : undefined,
  });

  results.push({
    question: "Is typography appropriate?",
    answer: score.typography > 60,
    improvement: score.typography <= 60 ? "Choose appropriate font personality matching product purpose, max 2-3 families" : undefined,
  });

  results.push({
    question: "Is visual density appropriate?",
    answer: score.density > 60,
    improvement: score.density <= 60 ? "Adjust padding, gaps, card sizes for appropriate density" : undefined,
  });

  results.push({
    question: "Are decorative assets helping rather than distracting?",
    answer: score.composition > 60,
    improvement: score.composition <= 60 ? "Ensure visual assets support focal point, not overpower content" : undefined,
  });

  results.push({
    question: "Does the page have a coherent visual personality?",
    answer: score.overall > 65,
    improvement: score.overall <= 65 ? "Establish coherent design system: colors, typography, spacing, components, surfaces" : undefined,
  });

  results.push({
    question: "Does anything look accidentally generated?",
    answer: score.rhythm > 60 && score.alignment > 60,
    improvement: score.rhythm <= 60 ? "Fix irregular spacing rhythm, use 8px scale" : undefined,
  });

  results.push({
    question: "Does the interface feel professionally art-directed?",
    answer: score.overall > 70,
    improvement: score.overall <= 70 ? "Improve overall execution: hierarchy, whitespace, rhythm, alignment, contrast, consistency" : undefined,
  });

  return results;
}

function improveAesthetics(screen: UIScreen): UIScreen {
  // Feature preservation – store original for restoration
  const originalComponents = [...screen.components];
  const originalCount = originalComponents.length;
  const originalIds = new Set(originalComponents.map((c) => c.id));

  let components = [...screen.components];
  const personality = inferProductPersonality(screen.name, components);
  const borderRadius = getBorderRadiusForPersonality(personality);
  const depth = getDepthForPersonality(personality);
  const shadows = {
    style: depth.style,
    card: depth.card,
    elevated: depth.elevated,
  };
  const spacingTokens = {
    scale: SPACING_SCALE,
    density: components.length > 12 ? "dense" : components.length < 5 ? "airy" : "balanced",
    style: "consistent rhythm",
  };
  const aestheticTokens = {
    hierarchy: "clear primary > secondary > supporting",
    density: spacingTokens.density,
    depth: depth.background,
    composition: personality === "luxury" ? "centered balanced with whitespace" : "balanced with intentional asymmetry",
    personality,
  };

  // Ensure design system exists and is coherent
  const existingDesign = screen.design || {};
  const existingPalette = existingDesign.colorPalette || {};
  const existingTypography = existingDesign.typography || {};
  const existingLayout = existingDesign.layout || {};

  // If palette missing or incomplete, keep existing but ensure we have at least primary/secondary/accent from theme or infer
  // We don't invent colors if already present, but ensure consistency
  const palette: ColorPalette = {
    primary: existingPalette.primary || "#4E1F6E",
    secondary: existingPalette.secondary || "#3E3E75",
    accent: existingPalette.accent || "#45A9A9",
    background: existingPalette.background || (personality === "luxury" ? "#faf8f6" : "#fcfcfd"),
    surface: existingPalette.surface || "#ffffff",
    text: existingPalette.text || "#18181b",
    muted: existingPalette.muted || "#71717a",
    border: existingPalette.border || "#e4e4e7",
  };

  // Typography – ensure hierarchy distinct, not one generic size
  // If headingWeight/bodyWeight missing, set based on personality
  const typography = {
    ...existingTypography,
    fontFamily: existingTypography.fontFamily || "Inter, sans-serif",
    displayFont: existingTypography.displayFont || existingTypography.headingFont || (personality === "luxury" ? "Playfair Display" : personality === "friendly" ? "Nunito" : "Outfit"),
    headingFont: existingTypography.headingFont || (personality === "luxury" ? "Playfair Display" : personality === "editorial" ? "Lora" : "Outfit"),
    bodyFont: existingTypography.bodyFont || "Inter",
    accentFont: existingTypography.accentFont,
    monoFont: existingTypography.monoFont || "JetBrains Mono",
    fontPersonality: existingTypography.fontPersonality || personality,
    headingWeight: existingTypography.headingWeight || (personality === "luxury" ? 700 : 700),
    bodyWeight: existingTypography.bodyWeight || 450,
    letterSpacing: existingTypography.letterSpacing || (personality === "luxury" ? "0.02em" : "-0.01em"),
    headingLineHeight: existingTypography.headingLineHeight || "1.15",
    bodyLineHeight: existingTypography.bodyLineHeight || "1.6",
  };

  // Layout – ensure spacing uses scale, alignment consistent
  const layout = {
    alignment: existingLayout.alignment || (components.some((c) => c.type === "input") ? "center" : "left"),
    spacing: existingLayout.spacing || "comfortable",
    style: existingLayout.style || personality,
  };

  // Component consistency – ensure repeated components share same dimensions where appropriate
  // Inputs same width
  const inputs = components.filter((c) => c.type === "input");
  if (inputs.length > 1) {
    const maxWidth = Math.max(...inputs.map((c) => c.width));
    const commonX = Math.min(...inputs.map((c) => c.x));
    components = components.map((c) => {
      if (c.type === "input") {
        return { ...c, width: maxWidth, x: commonX };
      }
      return c;
    });
  }

  // Buttons same height, consistent radius via variant
  const buttons = components.filter((c) => c.type === "button");
  if (buttons.length > 1) {
    const maxHeight = Math.max(...buttons.map((c) => c.height), 44);
    components = components.map((c) => {
      if (c.type === "button") {
        return { ...c, height: maxHeight };
      }
      return c;
    });
  }

  // Cards – consistent width/height per row already handled in layout-validation, but ensure border radius consistency via design tokens
  // We don't modify x,y here – layout-validation handles collision, but we ensure cards have consistent treatment

  // Visual hierarchy – ensure primary focal point is dominant
  // Find primary heading (first heading)
  const headings = components.filter((c) => c.type === "heading").sort((a, b) => a.y - b.y);
  if (headings.length > 0) {
    const primary = headings[0];
    // Make primary heading larger if not already
    const maxHeadingHeight = Math.max(...headings.map((h) => h.height));
    if (primary.height < maxHeadingHeight) {
      // Increase primary to be at least 1.2x secondary
      const secondaryMax = headings.length > 1 ? Math.max(...headings.slice(1).map((h) => h.height)) : 0;
      if (secondaryMax > 0 && primary.height < secondaryMax * 1.2) {
        primary.height = Math.round(secondaryMax * 1.3);
      }
    }
  }

  // Whitespace intelligence – ensure gaps use spacing scale
  // Sort by y and adjust gaps to nearest scale, preserving relationships
  const sorted = [...components].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const rawGap = curr.y - (prev.y + prev.height);
    if (rawGap < 0) continue; // overlapping handled in layout-validation
    if (rawGap < 8) {
      // Too crowded – increase to at least 12
      curr.y = prev.y + prev.height + 12;
    } else {
      // Snap to spacing scale for rhythm
      const snapped = snapToSpacingScale(rawGap);
      // Only adjust if difference is significant and not breaking intentional large gaps
      if (Math.abs(rawGap - snapped) > 8 && rawGap < 64) {
        curr.y = prev.y + prev.height + snapped;
      }
    }
  }

  // Update components from sorted
  const idToComponent = new Map(components.map((c) => [c.id, c]));
  for (const s of sorted) {
    idToComponent.set(s.id, s);
  }
  components = Array.from(idToComponent.values());

  // Composition and balance – ensure content centered if form-like, not one side heavy
  const avgCenterX = components.reduce((sum, c) => sum + c.x + c.width / 2, 0) / components.length;
  const deviation = Math.abs(avgCenterX - 500);
  if (deviation > 180 && components.every((c) => c.x + c.width < 700)) {
    // All clustered left – center them
    const shift = 500 - avgCenterX;
    components = components.map((c) => ({
      ...c,
      x: Math.max(20, Math.min(980 - c.width, c.x + shift)),
    }));
  }

  // Ensure primary CTA easy to find – if button with dashboard action exists, ensure it's near bottom of form and full width
  const primaryCTA = components.find(
    (c) => c.type === "button" && (c as { action?: string }).action?.toLowerCase().includes("dashboard")
  );
  if (primaryCTA) {
    const maxInputY = Math.max(0, ...components.filter((c) => c.type === "input").map((c) => c.y + c.height));
    if (maxInputY > 0 && primaryCTA.y < maxInputY) {
      primaryCTA.y = maxInputY + 24;
    }
  }

  // FEATURE PRESERVATION CHECK – ensure no component deleted to improve aesthetics
  // Aesthetic quality must NEVER override feature preservation
  if (components.length < originalCount) {
    const currentIds = new Set(components.map((c) => c.id));
    const missing = originalComponents.filter((c) => !currentIds.has(c.id));
    // Restore missing components with safe positioning below current flow
    let restoreY = Math.max(...components.map((c) => c.y + c.height), 0) + GAP;
    for (const miss of missing) {
      const restored = {
        ...miss,
        y: restoreY,
        x: Math.max(20, Math.min(980 - miss.width, miss.x)),
      };
      components.push(restored);
      restoreY += restored.height + GAP;
    }
  }

  // Ensure every original id still exists – if any id lost, restore
  const finalIds = new Set(components.map((c) => c.id));
  for (const origId of originalIds) {
    if (!finalIds.has(origId)) {
      const orig = originalComponents.find((c) => c.id === origId);
      if (orig) {
        components.push({ ...orig });
      }
    }
  }

  // Final design system with aesthetic tokens – coherent system
  const improvedDesign = {
    colorPalette: palette,
    typography,
    layout,
    borderRadius,
    shadows,
    depth,
    spacing: spacingTokens,
    aesthetic: aestheticTokens,
  } as DesignSystem & {
    borderRadius?: ReturnType<typeof getBorderRadiusForPersonality>;
    shadows?: typeof shadows;
    depth?: ReturnType<typeof getDepthForPersonality>;
    spacing?: typeof spacingTokens;
    aesthetic?: typeof aestheticTokens;
  };

  return {
    ...screen,
    components,
    design: improvedDesign,
  };
}

export interface AestheticResult {
  screen: UIScreen;
  score: AestheticScore;
  critique: ReturnType<typeof aestheticCritique>;
}

export function aestheticIntelligencePass(screen: UIScreen): AestheticResult {
  // Two-stage: structural design already done, now aesthetic intelligence
  let improved = improveAesthetics(screen);

  // Calculate score
  let score = calculateAestheticScore(improved);

  // Auto-critique and iterative improvement
  let critique = aestheticCritique(improved, score);
  let iterations = 0;
  const maxIterations = 2;

  while (iterations < maxIterations) {
    const failed = critique.filter((c) => !c.answer && c.improvement);
    if (failed.length === 0) break;

    // Apply improvements for failed critiques
    // For simplicity, we re-run improveAesthetics which already addresses many issues
    // In a more advanced system, we would apply specific fixes per failed question
    // For now, if overall score low, we try to improve spacing and hierarchy again
    if (score.overall < 70) {
      // Increase spacing, ensure hierarchy
      improved = improveAesthetics(improved);
      score = calculateAestheticScore(improved);
      critique = aestheticCritique(improved, score);
    } else {
      break;
    }
    iterations++;
  }

  // Final score after improvements
  score = calculateAestheticScore(improved);
  critique = aestheticCritique(improved, score);

  return {
    screen: improved,
    score,
    critique,
  };
}

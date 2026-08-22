/**
 * Layout validation and spatial reasoning layer
 * Prevents overlapping, crowded, messy prototypes
 * Treats sketch as low-fidelity spatial blueprint but corrects accidental layout problems
 */

import type { UIComponent, UIScreen } from "./ui-schema";

const GAP = 20; // minimum gap in 0-1000 scale (~16-20px)
const MIN_COMPONENT_GAP = 16;

function rectsOverlap(a: UIComponent, b: UIComponent): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

function hasHorizontalOverlap(a: UIComponent, b: UIComponent): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width;
}

function estimateTextWidth(text: string, isHeading: boolean): number {
  // Rough estimate: heading ~14px per char, body ~8px per char at 1000 scale ~10px per char?
  // For 0-1000 system, width 300 ~ 30% of screen ~ 360px desktop, so char width ~8-12 in 0-1000 units
  const avgChar = isHeading ? 14 : 8;
  const min = isHeading ? 120 : 80;
  return Math.max(min, text.length * avgChar + 32);
}

function isCard(type: string): boolean {
  return type === "card";
}

/**
 * Main layout validation and auto-fix
 * Returns corrected screen with no unintentional overlaps, consistent spacing, grid intelligence
 */
export function validateAndFixLayout(screen: UIScreen): UIScreen {
  let components = [...screen.components];

  // Sort by y then x for reading order, but preserve original ids
  components.sort((a, b) => a.y - b.y || a.x - b.x);

  // 1. TEXT OVERFLOW – ensure width fits content
  components = components.map((c) => {
    if ((c.type === "heading" || c.type === "text" || c.type === "button") && "text" in c) {
      const txt = (c as { text: string }).text || "";
      const required = estimateTextWidth(txt, c.type === "heading" || c.type === "button");
      if (c.width < required) {
        // Increase width, but clamp to 900 max and keep within 0-1000
        const newWidth = Math.min(900, Math.max(c.width, required));
        // If would overflow right edge, shift x left
        let newX = c.x;
        if (newX + newWidth > 980) {
          newX = Math.max(20, 980 - newWidth);
        }
        return { ...c, width: newWidth, x: newX };
      }
    }
    if (c.type === "button") {
      // Buttons need min width 120, height 44 in our scale ~ height 44 ~ 44 in 1000? Actually height 44 ~ 44, but we use min 40
      const minW = 120;
      const minH = 40;
      if (c.width < minW || c.height < minH) {
        return {
          ...c,
          width: Math.max(c.width, minW),
          height: Math.max(c.height, minH),
        };
      }
    }
    if (c.type === "input") {
      if (c.width < 140 || c.height < 36) {
        return {
          ...c,
          width: Math.max(c.width, 200),
          height: Math.max(c.height, 44),
        };
      }
    }
    return c;
  });

  // 2. CONTAINER AWARENESS & FORM LAYOUT INTELLIGENCE
  // Detect if this looks like a login/form: has heading at top + inputs + button
  const hasHeading = components.some((c) => c.type === "heading");
  const inputCount = components.filter((c) => c.type === "input").length;
  const buttonCount = components.filter((c) => c.type === "button").length;
  const isFormLike = hasHeading && inputCount >= 1 && buttonCount >= 1 && components.length <= 8;

  if (isFormLike) {
    // Center form: consistent x and width for inputs/buttons, vertical stack
    const formWidth = 400;
    const formX = Math.round((1000 - formWidth) / 2); // 300
    let currentY = 120; // start after logo/heading area

    // Find heading(s) – place at top centered
    const headings = components.filter((c) => c.type === "heading");
    const others = components.filter((c) => c.type !== "heading");

    // Sort headings by y, keep them at top
    headings.sort((a, b) => a.y - b.y);
    for (const h of headings) {
      h.x = formX;
      h.y = currentY;
      h.width = formWidth;
      // Heading height based on text
      h.height = Math.max(h.height, 50);
      currentY += h.height + 24;
    }

    // For remaining, if they are text (subtitle), place below heading
    const texts = others.filter((c) => c.type === "text");
    const inputs = others.filter((c) => c.type === "input");
    const buttons = others.filter((c) => c.type === "button");
    const cards = others.filter((c) => c.type === "card");
    const images = others.filter((c) => c.type === "image");

    // Texts – below heading, centered
    for (const t of texts) {
      t.x = formX;
      t.y = currentY;
      t.width = formWidth;
      currentY += t.height + 16;
    }

    // Inputs – vertical stack with consistent gap
    inputs.sort((a, b) => a.y - b.y);
    for (const inp of inputs) {
      inp.x = formX;
      inp.y = currentY;
      inp.width = formWidth;
      currentY += inp.height + 16;
    }

    // Buttons – vertical stack, primary first
    buttons.sort((a, b) => a.y - b.y);
    for (const btn of buttons) {
      btn.x = formX;
      btn.y = currentY;
      btn.width = formWidth;
      currentY += btn.height + 16;
    }

    // Cards – if any in form context, place below with grid
    if (cards.length > 0) {
      currentY += 16;
      // Simple: stack cards vertically in form width if not many, or grid if many
      if (cards.length <= 2) {
        for (const card of cards) {
          card.x = formX;
          card.y = currentY;
          card.width = formWidth;
          currentY += card.height + 16;
        }
      } else {
        // Grid for cards
        const grid = arrangeCardsGrid(cards, 50, currentY, 900, GAP);
        components = [...headings, ...texts, ...inputs, ...buttons, ...grid, ...images];
        // Re-sort and continue to collision check
        components.sort((a, b) => a.y - b.y || a.x - b.x);
        return finalCollisionCheck({ ...screen, components });
      }
    }

    // Images – place at top if logo, else keep but ensure no overlap
    for (const img of images) {
      // If image is small and near top, treat as logo/avatar at top
      if (img.y < 100 && img.width < 150) {
        img.x = formX + (formWidth - img.width) / 2;
        // Already placed? Move to top before heading
        // For simplicity, put at very top
        img.y = 30;
      } else {
        // Ensure below current flow if not already placed
        if (img.y < currentY) {
          img.y = currentY;
          currentY += img.height + 16;
        }
      }
    }

    components = [...headings, ...texts, ...inputs, ...buttons, ...cards, ...images];
  } else {
    // 3. GRID INTELLIGENCE for cards
    const cards = components.filter((c) => isCard(c.type));
    const nonCards = components.filter((c) => !isCard(c.type));

    if (cards.length >= 2) {
      // Find the y where cards start
      const minCardY = Math.min(...cards.map((c) => c.y));
      const arranged = arrangeCardsGrid(cards, 50, minCardY, 900, 24);
      components = [...nonCards, ...arranged];
    }
  }

  // 4. FINAL COLLISION CHECK – ensure no overlapping
  return finalCollisionCheck({ ...screen, components });
}

function arrangeCardsGrid(cards: UIComponent[], startX: number, startY: number, totalWidth: number, gap: number): UIComponent[] {
  // Sort cards by original y to preserve intent, but arrange in grid
  const sorted = [...cards].sort((a, b) => a.y - b.y || a.x - b.x);

  const perRow = sorted.length >= 6 ? 3 : sorted.length >= 4 ? 3 : sorted.length === 3 ? 3 : sorted.length === 2 ? 2 : 1;
  const cardWidth = Math.floor((totalWidth - gap * (perRow - 1)) / perRow);
  const cardHeight = Math.max(...sorted.map((c) => c.height), 160);

  const arranged: UIComponent[] = [];
  let x = startX;
  let y = startY;
  let col = 0;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    arranged.push({
      ...c,
      x,
      y,
      width: cardWidth,
      height: cardHeight,
    });

    col++;
    if (col >= perRow) {
      col = 0;
      x = startX;
      y += cardHeight + gap;
    } else {
      x += cardWidth + gap;
    }
  }

  return arranged;
}

function finalCollisionCheck(screen: UIScreen): UIScreen {
  const components = [...screen.components].sort((a, b) => a.y - b.y || a.x - b.x);
  const fixed: UIComponent[] = [];

  for (let i = 0; i < components.length; i++) {
    const current = { ...components[i] };

    // Check against all already fixed components
    for (let j = 0; j < fixed.length; j++) {
      const prev = fixed[j];

      // If overlapping, reposition current below prev if they share horizontal space
      if (rectsOverlap(current, prev)) {
        // If same row (y close) and both cards, we already handled grid, but if still overlapping, push down
        // Prefer vertical push if horizontal overlap is significant
        if (hasHorizontalOverlap(current, prev)) {
          const newY = prev.y + prev.height + GAP;
          // Only push down, never up, to preserve reading order
          if (newY > current.y) {
            current.y = newY;
          }
        } else {
          // No horizontal overlap but still overlap due to height – push down slightly
          current.y = Math.max(current.y, prev.y + prev.height + GAP);
        }
      }
    }

    // Ensure enough whitespace – check if too close vertically to previous with same x alignment
    for (const prev of fixed) {
      if (hasHorizontalOverlap(current, prev)) {
        const verticalGap = current.y - (prev.y + prev.height);
        if (verticalGap >= 0 && verticalGap < MIN_COMPONENT_GAP) {
          current.y = prev.y + prev.height + GAP;
        }
      }
    }

    // Ensure inside 0-1000 bounds, clamp
    if (current.x + current.width > 980) {
      current.x = Math.max(20, 980 - current.width);
    }
    if (current.y + current.height > 980) {
      // If overflow bottom, try to keep but allow scroll – clamp to 980 - height, but if still overlapping previous, we already pushed
      current.y = Math.min(current.y, 980 - current.height);
      // If after clamping still overlaps, we keep as is but will be scrollable – better than infinite loop
    }
    if (current.x < 20) current.x = 20;
    if (current.y < 20) current.y = 20;

    fixed.push(current);
  }

  // Second pass – ensure no new overlaps introduced by clamping
  // Simple iterative fix up to 3 passes
  let passes = 0;
  let hasOverlap = true;
  while (hasOverlap && passes < 3) {
    hasOverlap = false;
    passes++;
    for (let i = 1; i < fixed.length; i++) {
      for (let j = 0; j < i; j++) {
        if (rectsOverlap(fixed[i], fixed[j]) && hasHorizontalOverlap(fixed[i], fixed[j])) {
          hasOverlap = true;
          fixed[i].y = fixed[j].y + fixed[j].height + GAP;
        }
      }
    }
  }

  return {
    ...screen,
    components: fixed,
  };
}

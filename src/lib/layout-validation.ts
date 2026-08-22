/**
 * Layout validation and spatial reasoning layer
 * Prevents overlapping, crowded, messy prototypes
 * Treats sketch as low-fidelity spatial blueprint but corrects accidental layout problems
 *
 * Spatial model (final validation pass):
 * - Every component rectangle is checked against every other component.
 * - Intentional parent/child nesting is allowed: cards act as containers and large
 *   hero images may hold overlay content. Children are kept inside their parent and
 *   reflowed with consistent padding, gaps and shared alignment edges.
 * - Unrelated sibling components must never overlap. Overlaps are resolved by
 *   repositioning / reflowing – NEVER by deleting a component.
 */

import type { UIComponent, UIScreen } from "./ui-schema";

const GAP = 20; // minimum sibling gap in 0-1000 scale (~16-20px)
const CANVAS_MIN = 20;
const CANVAS_RIGHT = 980; // right content edge (20 unit margin)
const FORM_WIDTH = 400;
const FORM_X = Math.round((1000 - FORM_WIDTH) / 2); // 300
const CARD_PAD = 24; // internal padding of card containers
const HERO_PAD = 40; // internal padding of hero image overlays
const CARD_MIN_HEIGHT = 160;
const CONTAINER_GAP = 12; // consistent gap between children inside a container
const CARD_GRID_GAP = 24;
const FORM_FIELD_GAP = 16;
const SPACING_SCALE = [8, 12, 16, 20, 24, 32, 48];

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

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

function horizontalOverlapRatio(a: UIComponent, b: UIComponent): number {
  const inter = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  if (inter <= 0) return 0;
  return inter / Math.min(a.width, b.width);
}

function verticalOverlapRatio(a: UIComponent, b: UIComponent): number {
  const inter = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (inter <= 0) return 0;
  return inter / Math.min(a.height, b.height);
}

function rectArea(c: UIComponent): number {
  return c.width * c.height;
}

function estimateTextWidth(text: string, isHeading: boolean): number {
  // Rough estimate: heading ~14px per char, body ~8px per char at 1000 scale ~10px per char?
  // For 0-1000 system, width 300 ~ 30% of screen ~ 360px desktop, so char width ~8-12 in 0-1000 units
  const avgChar = isHeading ? 14 : 8;
  const min = isHeading ? 120 : 80;
  return Math.max(min, text.length * avgChar + 32);
}

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

/* ------------------------------------------------------------------ */
/* Parent / child containment model                                    */
/* ------------------------------------------------------------------ */

export interface ComponentContainment {
  /** childId -> parentId */
  parentOf: Map<string, string>;
  /** parentId -> child ids (direct children) */
  childrenOf: Map<string, string[]>;
}

function isHeroImage(c: UIComponent): boolean {
  return c.type === "image" && c.width >= 450 && c.height >= 200;
}

function canBeParent(c: UIComponent): boolean {
  return c.type === "card" || isHeroImage(c);
}

function canBeChild(parent: UIComponent, child: UIComponent): boolean {
  // Cards never nest inside another card – two stacked card rects are an accident.
  if (child.type === "card") return false;
  // A card may hold any other component (heading, text, input, button, image).
  if (parent.type === "card") return true;
  // A large hero image may intentionally carry overlay heading / text / CTA.
  return child.type === "heading" || child.type === "text" || child.type === "button";
}

function isFullyContained(child: UIComponent, parent: UIComponent): boolean {
  const inset = 4;
  return (
    child.x >= parent.x + inset &&
    child.y >= parent.y + inset &&
    child.x + child.width <= parent.x + parent.width - inset &&
    child.y + child.height <= parent.y + parent.height - inset &&
    child.width < parent.width &&
    child.height < parent.height &&
    // Allow full-width card content (text blocks, images) while still rejecting
    // near-total overlaps that are really accidental duplicate rectangles.
    rectArea(child) <= rectArea(parent) * 0.88
  );
}

/**
 * Detect intentional parent/child nesting from component rectangles.
 * The parent is always the smallest container that fully contains the child.
 */
export function detectContainment(components: UIComponent[]): ComponentContainment {
  const parents = components.filter(canBeParent);
  const parentOf = new Map<string, string>();
  const childrenOf = new Map<string, string[]>();
  for (const p of parents) childrenOf.set(p.id, []);

  for (const child of components) {
    let best: UIComponent | null = null;
    for (const parent of parents) {
      if (parent.id === child.id) continue;
      if (!canBeChild(parent, child)) continue;
      if (!isFullyContained(child, parent)) continue;
      if (!best || rectArea(parent) < rectArea(best)) best = parent;
    }
    if (best) {
      parentOf.set(child.id, best.id);
      childrenOf.get(best.id)!.push(child.id);
    }
  }

  // Sort children by reading order for deterministic layout
  const byId = new Map(components.map((c) => [c.id, c]));
  for (const kids of childrenOf.values()) {
    kids.sort((a, b) => {
      const ca = byId.get(a)!;
      const cb = byId.get(b)!;
      return ca.y - cb.y || ca.x - cb.x;
    });
  }
  return { parentOf, childrenOf };
}

/* ------------------------------------------------------------------ */
/* Component normalization (text width, min sizes)                     */
/* ------------------------------------------------------------------ */

function normalizeComponents(components: UIComponent[]): UIComponent[] {
  return components.map((c) => {
    let out: UIComponent = { ...c };

    if ((out.type === "heading" || out.type === "text" || out.type === "button") && "text" in out) {
      const txt = (out as { text: string }).text || "";
      const required = estimateTextWidth(txt, out.type === "heading" || out.type === "button");
      if (out.width < required) {
        const newWidth = Math.min(900, Math.max(out.width, required));
        let newX = out.x;
        if (newX + newWidth > CANVAS_RIGHT) {
          newX = Math.max(CANVAS_MIN, CANVAS_RIGHT - newWidth);
        }
        out = { ...out, width: newWidth, x: newX };
      }
    }
    if (out.type === "button") {
      const minW = 120;
      const minH = 40;
      if (out.width < minW || out.height < minH) {
        out = {
          ...out,
          width: Math.max(out.width, minW),
          height: Math.max(out.height, minH),
        };
      }
    }
    if (out.type === "input") {
      if (out.width < 140 || out.height < 36) {
        out = {
          ...out,
          width: Math.max(out.width, 200),
          height: Math.max(out.height, 44),
        };
      }
    }
    return out;
  });
}

/* ------------------------------------------------------------------ */
/* Map-based helpers that keep parent/child trees together             */
/* ------------------------------------------------------------------ */

type ComponentMap = Map<string, UIComponent>;

function moveWithDescendants(map: ComponentMap, containment: ComponentContainment, id: string, dx: number, dy: number): void {
  const stack = [id];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const c = map.get(cur);
    if (!c) continue;
    if (dx !== 0 || dy !== 0) {
      map.set(cur, { ...c, x: Math.round(c.x + dx), y: Math.round(c.y + dy) });
    }
    for (const kid of containment.childrenOf.get(cur) ?? []) stack.push(kid);
  }
}

function setRectWithChildren(map: ComponentMap, containment: ComponentContainment, id: string, x: number, y: number, width: number, height: number): void {
  const c = map.get(id);
  if (!c) return;
  moveWithDescendants(map, containment, id, x - c.x, y - c.y);
  map.set(id, { ...map.get(id)!, x, y, width, height });
}

function getContainerChildren(map: ComponentMap, containment: ComponentContainment, parentId: string): UIComponent[] {
  return (containment.childrenOf.get(parentId) ?? [])
    .map((id) => map.get(id))
    .filter((c): c is UIComponent => Boolean(c));
}

function getTopLevel(map: ComponentMap, containment: ComponentContainment): UIComponent[] {
  return Array.from(map.values()).filter((c) => !containment.parentOf.has(c.id));
}

function clampToCanvas(map: ComponentMap, containment: ComponentContainment): void {
  for (const top of getTopLevel(map, containment)) {
    const dx = top.x + top.width > CANVAS_RIGHT ? CANVAS_RIGHT - (top.x + top.width) : 0;
    const dx2 = top.x + dx < CANVAS_MIN ? CANVAS_MIN - (top.x + dx) : 0;
    const dy = top.y < CANVAS_MIN ? CANVAS_MIN - top.y : 0;
    if (dx !== 0 || dx2 !== 0 || dy !== 0) {
      moveWithDescendants(map, containment, top.id, dx + dx2, dy);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Container child reflow (clean internal layout for cards / heroes)   */
/* ------------------------------------------------------------------ */

interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** True when two children visually belong to the same horizontal row. */
function sameRow(a: UIComponent, b: UIComponent): boolean {
  // Same vertical band, but clearly separated horizontally.
  return verticalOverlapRatio(a, b) >= 0.5 && horizontalOverlapRatio(a, b) < 0.3;
}

function computeContainerRows(children: UIComponent[]): UIComponent[][] {
  const sorted = [...children].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: UIComponent[][] = [];
  for (const child of sorted) {
    let added = false;
    for (const row of rows) {
      if (row.every((member) => sameRow(member, child))) {
        row.push(child);
        added = true;
        break;
      }
    }
    if (!added) rows.push([child]);
  }
  for (const row of rows) row.sort((a, b) => a.x - b.x || a.y - b.y);
  return rows;
}

function rowFitsSideBySide(row: UIComponent[], contentWidth: number): boolean {
  const total = row.reduce((s, c) => s + Math.min(c.width, contentWidth), 0) + CONTAINER_GAP * (row.length - 1);
  return total <= contentWidth;
}

/** Total height (0-1000 units) consumed by children flowing inside a container. */
function containerContentHeight(children: UIComponent[], contentWidth: number): number {
  const rows = computeContainerRows(children);
  let cursor = 0;
  for (const row of rows) {
    if (row.length === 1) {
      cursor += row[0].height + CONTAINER_GAP;
    } else if (rowFitsSideBySide(row, contentWidth)) {
      cursor += Math.max(...row.map((c) => c.height)) + CONTAINER_GAP;
    } else {
      cursor += row.reduce((s, c) => s + c.height + CONTAINER_GAP, 0);
    }
  }
  return cursor > 0 ? cursor - CONTAINER_GAP : 0;
}

function containerPad(container: UIComponent): number {
  return container.type === "image" ? HERO_PAD : CARD_PAD;
}

function requiredContainerHeight(container: UIComponent, children: UIComponent[], width: number): number {
  const pad = containerPad(container);
  const contentWidth = Math.max(CARD_PAD, width - pad * 2);
  return Math.max(container.height, containerContentHeight(children, contentWidth) + pad * 2, CARD_MIN_HEIGHT);
}

/** Reflow direct children inside their parent with consistent padding/gaps/alignment. */
function reflowContainers(map: ComponentMap, containment: ComponentContainment): void {
  // Process deepest containers first so a child container's grown size is final
  // before its parent lays it out, then move whole subtrees together.
  const parentsWithDepth = Array.from(containment.childrenOf.keys())
    .map((id) => {
      let depth = 0;
      let cur: string | undefined = containment.parentOf.get(id);
      while (cur) {
        depth++;
        cur = containment.parentOf.get(cur);
      }
      return { id, depth };
    })
    .sort((a, b) => b.depth - a.depth);

  for (const { id: parentId } of parentsWithDepth) {
    const parent = map.get(parentId);
    if (!parent) continue;
    const children = getContainerChildren(map, containment, parentId);
    if (children.length === 0) continue;

    const pad = containerPad(parent);
    const contentX = parent.x + pad;
    const contentY = parent.y + pad;
    const contentWidth = Math.max(CARD_PAD, parent.width - pad * 2);
    const rows = computeContainerRows(children);

    const placements = new Map<string, Placement>();
    let cursor = contentY;

    for (const row of rows) {
      if (row.length === 1) {
        const c = row[0];
        placements.set(c.id, { x: Math.round(contentX), y: Math.round(cursor), width: contentWidth, height: c.height });
        cursor += c.height + CONTAINER_GAP;
      } else if (rowFitsSideBySide(row, contentWidth)) {
        const rowHeight = Math.max(...row.map((c) => c.height));
        let x = contentX;
        for (const c of row) {
          placements.set(c.id, { x: Math.round(x), y: Math.round(cursor), width: c.width, height: c.height });
          x += c.width + CONTAINER_GAP;
        }
        cursor += rowHeight + CONTAINER_GAP;
      } else {
        // Not enough room for the row – reflow as a clean vertical stack.
        for (const c of row) {
          placements.set(c.id, { x: Math.round(contentX), y: Math.round(cursor), width: contentWidth, height: c.height });
          cursor += c.height + CONTAINER_GAP;
        }
      }
    }

    const contentHeight = cursor > contentY ? cursor - CONTAINER_GAP - contentY : 0;
    const requiredHeight = contentHeight + pad * 2;
    if (parent.height < requiredHeight) {
      map.set(parentId, { ...parent, height: Math.round(requiredHeight) });
    }

    for (const [id, p] of placements) {
      // A child may itself be a container (e.g. hero image inside a card) – move its
      // whole subtree with it so nested descendants stay inside.
      if (map.has(id)) setRectWithChildren(map, containment, id, p.x, p.y, p.width, p.height);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Form layout intelligence                                            */
/* ------------------------------------------------------------------ */

function detectFormLike(components: UIComponent[]): boolean {
  const hasHeading = components.some((c) => c.type === "heading");
  const inputs = components.filter((c) => c.type === "input");
  const buttons = components.filter((c) => c.type === "button");
  if (!hasHeading || inputs.length === 0 || buttons.length === 0) return false;

  const controlCount = inputs.length + buttons.length;
  const total = Math.max(1, components.length);
  const controlRatio = controlCount / total;

  // Login / signup style screens: multiple stacked fields + action buttons.
  if (inputs.length >= 2 && controlRatio >= 0.4) return true;
  // Small dedicated screens (single field + CTA).
  if (inputs.length === 1 && controlRatio >= 0.5 && total <= 6) return true;
  return false;
}

function applyFormLayout(map: ComponentMap, containment: ComponentContainment, topLevel: UIComponent[]): void {
  const cards = topLevel.filter((c) => c.type === "card").sort((a, b) => a.y - b.y || a.x - b.x);
  const images = topLevel.filter((c) => c.type === "image").sort((a, b) => a.y - b.y || a.x - b.x);
  const logos = images.filter((img) => img.y < 100 && img.width < 150);
  const otherImages = images.filter((img) => !logos.includes(img));

  // Preserve the sketch's reading order while reflowing into a clean vertical form.
  const flowItems = topLevel.filter((c) => c.type !== "card" && c.type !== "image");
  const rows = computeContainerRows(flowItems);
  let currentY = 120;

  for (const logo of logos) {
    setRectWithChildren(map, containment, logo.id, Math.round(FORM_X + (FORM_WIDTH - logo.width) / 2), 30, logo.width, logo.height);
  }

  for (const row of rows) {
    const rowHeight = Math.max(...row.map((c) => c.height));
    const totalWidth = row.reduce((s, c) => s + Math.min(c.width, FORM_WIDTH), 0) + FORM_FIELD_GAP * (row.length - 1);

    if (row.length > 1 && totalWidth <= FORM_WIDTH) {
      // Two related items that were intended side-by-side share one row + edges.
      let x = FORM_X;
      for (const c of row) {
        setRectWithChildren(map, containment, c.id, x, currentY, c.width, c.height);
        x += c.width + FORM_FIELD_GAP;
      }
      currentY += rowHeight + FORM_FIELD_GAP;
    } else {
      // Single column: every field/button full width, same x, clean vertical gaps.
      for (const c of row) {
        setRectWithChildren(map, containment, c.id, FORM_X, currentY, FORM_WIDTH, c.height);
        currentY += c.height + FORM_FIELD_GAP;
      }
    }
  }

  // Non-logo images flow below the form, centered in the form column.
  if (otherImages.length > 0) {
    currentY += 16;
    for (const img of otherImages) {
      setRectWithChildren(map, containment, img.id, Math.round(FORM_X + (FORM_WIDTH - img.width) / 2), currentY, img.width, img.height);
      currentY += img.height + FORM_FIELD_GAP;
    }
  }

  // Cards in form context: stack small sets, grid larger sets.
  if (cards.length > 0) {
    currentY += 16;
    if (cards.length <= 2) {
      for (const card of cards) {
        setRectWithChildren(map, containment, card.id, FORM_X, currentY, FORM_WIDTH, card.height);
        currentY += card.height + FORM_FIELD_GAP;
      }
    } else {
      arrangeCardsGrid(map, containment, cards, 50, currentY, 900, CARD_GRID_GAP);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Card grid intelligence                                              */
/* ------------------------------------------------------------------ */

function arrangeCardsGrid(
  map: ComponentMap,
  containment: ComponentContainment,
  cards: UIComponent[],
  startX: number,
  startY: number,
  totalWidth: number,
  gap: number
): void {
  const sorted = [...cards].sort((a, b) => a.y - b.y || a.x - b.x);
  if (sorted.length < 2) return;

  const perRow = sorted.length >= 4 ? 3 : sorted.length === 3 ? 3 : 2;
  const cardWidth = Math.floor((totalWidth - gap * (perRow - 1)) / perRow);

  const required = sorted.map((c) => {
    const children = getContainerChildren(map, containment, c.id);
    if (children.length === 0) return Math.max(c.height, CARD_MIN_HEIGHT);
    return requiredContainerHeight(c, children, cardWidth);
  });

  const rowsCount = Math.ceil(sorted.length / perRow);
  let y = startY;
  for (let r = 0; r < rowsCount; r++) {
    const rowItems = sorted.slice(r * perRow, r * perRow + perRow);
    const rowHeight = Math.max(...rowItems.map((_, i) => required[r * perRow + i]));
    let x = startX;
    for (const c of rowItems) {
      setRectWithChildren(map, containment, c.id, x, y, cardWidth, rowHeight);
      x += cardWidth + gap;
    }
    y += rowHeight + gap;
  }
}

/* ------------------------------------------------------------------ */
/* Top-level organization (forms + card grids)                         */
/* ------------------------------------------------------------------ */

function organizeTopLevel(map: ComponentMap, containment: ComponentContainment): void {
  const topLevel = getTopLevel(map, containment);
  const formLike = detectFormLike(topLevel);
  const cards = topLevel.filter((c) => c.type === "card");

  if (formLike) {
    applyFormLayout(map, containment, topLevel);
    return;
  }

  // Grid intelligence for repeated sibling cards (including cards with children).
  if (cards.length >= 2) {
    const minCardY = Math.min(...cards.map((c) => c.y));
    arrangeCardsGrid(map, containment, cards, 50, minCardY, 900, CARD_GRID_GAP);
  }
}

/* ------------------------------------------------------------------ */
/* Final sibling collision resolution (reposition, never delete)       */
/* ------------------------------------------------------------------ */

function resolveSiblingCollisions(map: ComponentMap, containment: ComponentContainment): void {
  const topLevel = getTopLevel(map, containment);
  const order = [...topLevel]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((c) => c.id);

  // Generous bound: worst case each pass places one more component in its final slot.
  const maxPasses = Math.max(10, order.length * order.length + 8);

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (let i = 1; i < order.length; i++) {
      for (let j = 0; j < i; j++) {
        const later = map.get(order[i]);
        const earlier = map.get(order[j]);
        if (!later || !earlier) continue;
        if (!rectsOverlap(later, earlier)) continue;

        changed = true;
        // The component later in reading order is the one that moves.
        const [blocker, mover] =
          later.y > earlier.y || (later.y === earlier.y && later.x >= earlier.x)
            ? [earlier, later]
            : [later, earlier];

        // Same-row overlap: slide the mover to the right of the blocker when room exists.
        const spaceRight = CANVAS_RIGHT - (blocker.x + blocker.width);
        if (verticalOverlapRatio(mover, blocker) >= 0.5 && mover.width + GAP <= spaceRight) {
          const dx = blocker.x + blocker.width + GAP - mover.x;
          const dy = 0;
          moveWithDescendants(map, containment, mover.id, dx, dy);
          continue;
        }

        // Vertical reflow: place mover below blocker, sharing its left edge when close.
        const newY = blocker.y + blocker.height + GAP;
        const dy = newY - mover.y;
        const dx = Math.abs(mover.x - blocker.x) <= 40 ? blocker.x - mover.x : 0;
        moveWithDescendants(map, containment, mover.id, dx, dy);
      }
    }

    if (!changed) break;
  }
}

/* ------------------------------------------------------------------ */
/* Whitespace + shared alignment edges                                 */
/* ------------------------------------------------------------------ */

function polishSpacingAndAlignment(map: ComponentMap, containment: ComponentContainment): void {
  const topLevel = getTopLevel(map, containment);
  const sorted = [...topLevel].sort((a, b) => a.y - b.y || a.x - b.x);

  // 1. Consistent vertical whitespace within the same column.
  // Always read current geometry from the map (earlier moves shift later rows).
  for (let i = 1; i < sorted.length; i++) {
    const prev = map.get(sorted[i - 1].id);
    const curr = map.get(sorted[i].id);
    if (!prev || !curr) continue;
    if (!hasHorizontalOverlap(prev, curr)) continue;
    const gap = curr.y - (prev.y + prev.height);
    if (gap < 0) continue; // overlap – resolved by collision pass

    if (gap < 8) {
      moveWithDescendants(map, containment, curr.id, 0, prev.y + prev.height + GAP - curr.y);
    } else if (gap < 48) {
      const snapped = snapToSpacingScale(gap);
      if (Math.abs(gap - snapped) > 4) {
        moveWithDescendants(map, containment, curr.id, 0, snapped - gap);
      }
    }
  }

  // 2. Fix tiny crookedness: components already in the same column snap to a shared left edge.
  const after = getTopLevel(map, containment);
  const sortedAfter = [...after].sort((a, b) => a.y - b.y || a.x - b.x);
  let group: UIComponent[] = [];
  const flushGroup = () => {
    if (group.length >= 2) {
      const xs = group.map((c) => c.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      if (maxX - minX <= 24) {
        const target = Math.round(group[0].x);
        for (const c of group) {
          if (c.x !== target) moveWithDescendants(map, containment, c.id, target - c.x, 0);
        }
      }
    }
    group = [];
  };

  for (let i = 0; i < sortedAfter.length; i++) {
    const curr = sortedAfter[i];
    if (group.length === 0) {
      group = [curr];
      continue;
    }
    const prev = group[group.length - 1];
    const verticalGap = curr.y - (prev.y + prev.height);
    if (hasHorizontalOverlap(prev, curr) && verticalGap >= 0 && verticalGap < 64) {
      group.push(curr);
    } else {
      flushGroup();
      group = [curr];
    }
  }
  flushGroup();
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

/**
 * Main layout validation and auto-fix
 * Returns corrected screen with no unintentional overlaps, consistent spacing, grid intelligence
 * CRITICAL: Never solves layout problem by deleting component – preserves every explicit feature
 */
export function validateAndFixLayout(screen: UIScreen): UIScreen {
  const originalComponents = [...screen.components];
  const originalCount = originalComponents.length;

  // 1. Size normalization (text fits, buttons/inputs meet minimums).
  const normalized = normalizeComponents(originalComponents);
  const map: ComponentMap = new Map(normalized.map((c) => [c.id, c]));

  // 2. Detect intentional parent/child nesting from final geometry.
  let containment = detectContainment(Array.from(map.values()));

  // 3. Organize top-level components (form vertical flow, aligned card grids).
  organizeTopLevel(map, containment);

  // 4. Resolve accidental sibling overlaps (reposition, never delete).
  resolveSiblingCollisions(map, containment);

  // 5. Reflow nested children inside their containers; grow containers to fit.
  reflowContainers(map, containment);

  // 6. Whitespace rhythm + shared alignment edges.
  polishSpacingAndAlignment(map, containment);

  // 7. Keep everything inside the canvas (children move with their parents).
  clampToCanvas(map, containment);

  // 8. FINAL safety sweep – runs last so nothing can re-introduce an overlap.
  resolveSiblingCollisions(map, containment);

  let components = Array.from(map.values());

  // 9. FEATURE PRESERVATION – ensure no component deleted during layout fixes
  // Aesthetic quality must NEVER override feature preservation
  if (components.length < originalCount) {
    const currentIds = new Set(components.map((c) => c.id));
    const missing = originalComponents.filter((c) => !currentIds.has(c.id));
    let restoreY = Math.max(...components.map((c) => c.y + c.height), 0) + GAP;
    const restored = [...components];
    for (const miss of missing) {
      restored.push({
        ...miss,
        y: restoreY,
        x: Math.max(CANVAS_MIN, Math.min(CANVAS_RIGHT - miss.width, miss.x)),
      });
      restoreY += miss.height + GAP;
    }
    components = restored;
  }

  // 10. Rebuild containment from final geometry so the renderer sees the same model.
  containment = detectContainment(components);

  return {
    ...screen,
    components,
  };
}

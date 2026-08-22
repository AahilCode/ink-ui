/**
 * Strict TypeScript schema for INK UI structured output
 * Supported types: heading, text, input, button, card, image
 * Extended with optional design-intelligence fields for polished high-fidelity generation
 */

export const SUPPORTED_TYPES = ["heading", "text", "input", "button", "card", "image"] as const;
export type ComponentType = typeof SUPPORTED_TYPES[number];

export interface BaseComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* Component variants – existing required fields preserved for compatibility */
export interface HeadingComponent extends BaseComponent {
  type: "heading";
  text: string;
}

export interface TextComponent extends BaseComponent {
  type: "text";
  text: string;
}

export interface InputComponent extends BaseComponent {
  type: "input";
  placeholder?: string;
  text?: string;
}

export interface ButtonComponent extends BaseComponent {
  type: "button";
  text: string;
  action?: string;
}

export interface CardComponent extends BaseComponent {
  type: "card";
  text?: string;
}

export interface ImageComponent extends BaseComponent {
  type: "image";
  alt?: string;
}

export type UIComponent =
  | HeadingComponent
  | TextComponent
  | InputComponent
  | ButtonComponent
  | CardComponent
  | ImageComponent;

/* --- Design-intelligence extensions (optional, for polished output) --- */
export interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  border?: string;
}

export interface TypographySystem {
  fontFamily?: string;
  headingWeight?: number;
  bodyWeight?: number;
  headingSize?: string;
  bodySize?: string;
}

export interface LayoutSystem {
  alignment?: "left" | "center" | "right";
  spacing?: "compact" | "comfortable" | "spacious";
  style?: string;
}

export interface DesignSystem {
  colorPalette?: ColorPalette;
  typography?: TypographySystem;
  layout?: LayoutSystem;
}

export interface UIScreen {
  name: string;
  components: UIComponent[];
  design?: DesignSystem; // optional – polished design tokens
}

export interface UISchema {
  screen: UIScreen;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  data?: UISchema;
  error?: string;
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isValidType(t: unknown): t is ComponentType {
  return isString(t) && (SUPPORTED_TYPES as readonly string[]).includes(t);
}

function validateDesign(design: unknown): DesignSystem | undefined {
  if (!design || typeof design !== "object") return undefined;
  const d = design as Record<string, unknown>;
  const out: DesignSystem = {};

  // colorPalette
  if (d.colorPalette && typeof d.colorPalette === "object") {
    const cp = d.colorPalette as Record<string, unknown>;
    const palette: ColorPalette = {};
    const keys: (keyof ColorPalette)[] = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "muted",
      "border",
    ];
    for (const k of keys) {
      const v = cp[k];
      if (isString(v) && v.trim().length > 0) {
        // Accept hex or any non-empty string, but prefer hex – do not strictly fail on non-hex to allow inference
        palette[k] = v.trim();
      }
    }
    if (Object.keys(palette).length > 0) {
      out.colorPalette = palette;
    }
  }

  // typography
  if (d.typography && typeof d.typography === "object") {
    const tp = d.typography as Record<string, unknown>;
    const typo: TypographySystem = {};
    if (isString(tp.fontFamily)) typo.fontFamily = tp.fontFamily;
    if (isNumber(tp.headingWeight)) typo.headingWeight = tp.headingWeight;
    if (isNumber(tp.bodyWeight)) typo.bodyWeight = tp.bodyWeight;
    if (isString(tp.headingSize)) typo.headingSize = tp.headingSize;
    if (isString(tp.bodySize)) typo.bodySize = tp.bodySize;
    if (Object.keys(typo).length > 0) out.typography = typo;
  }

  // layout
  if (d.layout && typeof d.layout === "object") {
    const lp = d.layout as Record<string, unknown>;
    const layout: LayoutSystem = {};
    if (isString(lp.alignment) && ["left", "center", "right"].includes(lp.alignment)) {
      layout.alignment = lp.alignment as LayoutSystem["alignment"];
    }
    if (isString(lp.spacing) && ["compact", "comfortable", "spacious"].includes(lp.spacing)) {
      layout.spacing = lp.spacing as LayoutSystem["spacing"];
    }
    if (isString(lp.style)) layout.style = lp.style;
    if (Object.keys(layout).length > 0) out.layout = layout;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function validateUISchema(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Response is not an object" };
  }

  const obj = input as Record<string, unknown>;

  let screenRaw: unknown = obj["screen"];
  if (!screenRaw) {
    if (obj["components"] && obj["name"]) {
      screenRaw = obj;
    } else {
      return { valid: false, error: "Missing 'screen' object" };
    }
  }

  if (!screenRaw || typeof screenRaw !== "object") {
    return { valid: false, error: "'screen' must be an object" };
  }

  const screen = screenRaw as Record<string, unknown>;

  const name = screen["name"];
  if (!isString(name) || name.trim().length === 0) {
    return { valid: false, error: "screen.name must be a non-empty string" };
  }

  const comps = screen["components"];
  if (!Array.isArray(comps)) {
    return { valid: false, error: "screen.components must be an array" };
  }

  if (comps.length === 0) {
    return { valid: false, error: "No components detected in sketch" };
  }

  if (comps.length > 50) {
    return { valid: false, error: "Too many components (max 50)" };
  }

  // Optional design – validated if present, but not required for compatibility
  const design = validateDesign(screen["design"]);

  const validatedComponents: UIComponent[] = [];
  const ids = new Set<string>();

  for (let i = 0; i < comps.length; i++) {
    const c = comps[i] as Record<string, unknown>;
    if (!c || typeof c !== "object") {
      return { valid: false, error: `Component at index ${i} is not an object` };
    }

    const id = c["id"];
    if (!isString(id) || id.trim() === "") {
      return { valid: false, error: `Component at index ${i} missing valid 'id'` };
    }
    if (ids.has(id)) {
      return { valid: false, error: `Duplicate id '${id}'` };
    }
    ids.add(id);

    const type = c["type"];
    if (!isValidType(type)) {
      return { valid: false, error: `Component '${id}' has unsupported type '${String(type)}'` };
    }

    const x = c["x"];
    const y = c["y"];
    const width = c["width"];
    const height = c["height"];

    if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height)) {
      return {
        valid: false,
        error: `Component '${id}' has invalid coordinates. x,y,width,height must be numbers`,
      };
    }

    if (x < 0 || y < 0 || x > 2000 || y > 2000) {
      return { valid: false, error: `Component '${id}' has out-of-range x/y (must be 0-2000)` };
    }
    if (width <= 0 || height <= 0 || width > 2000 || height > 2000) {
      return { valid: false, error: `Component '${id}' has invalid width/height` };
    }

    const base: BaseComponent = {
      id: id.trim(),
      type,
      x,
      y,
      width,
      height,
    };

    switch (type) {
      case "heading":
      case "text": {
        const text = c["text"];
        if (!isString(text)) {
          return { valid: false, error: `Component '${id}' (${type}) requires 'text' string` };
        }
        validatedComponents.push({ ...base, type, text } as HeadingComponent | TextComponent);
        break;
      }
      case "button": {
        const text = c["text"];
        if (!isString(text)) {
          return { valid: false, error: `Component '${id}' (button) requires 'text' string` };
        }
        const action = c["action"];
        const comp: ButtonComponent = {
          ...base,
          type: "button",
          text,
          action: isString(action) ? action : undefined,
        };
        validatedComponents.push(comp);
        break;
      }
      case "input": {
        const placeholder = c["placeholder"];
        const text = c["text"];
        const comp: InputComponent = {
          ...base,
          type: "input",
          placeholder: isString(placeholder) ? placeholder : undefined,
          text: isString(text) ? text : undefined,
        };
        validatedComponents.push(comp);
        break;
      }
      case "card": {
        const text = c["text"];
        validatedComponents.push({
          ...base,
          type: "card",
          text: isString(text) ? text : undefined,
        } as CardComponent);
        break;
      }
      case "image": {
        const alt = c["alt"] ?? c["text"];
        validatedComponents.push({
          ...base,
          type: "image",
          alt: isString(alt) ? alt : undefined,
        } as ImageComponent);
        break;
      }
      default:
        return { valid: false, error: `Unsupported type '${type}'` };
    }
  }

  return {
    valid: true,
    data: {
      screen: {
        name: name.trim(),
        components: validatedComponents,
        ...(design ? { design } : {}),
      },
    },
  };
}

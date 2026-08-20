/**
 * Strict TypeScript schema for INK UI structured output
 * Supported types: heading, text, input, button, card, image
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
  text?: string; // sometimes label
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

export interface UIScreen {
  name: string;
  components: UIComponent[];
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

export function validateUISchema(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Response is not an object" };
  }

  const obj = input as Record<string, unknown>;

  // Allow both {screen: {...}} and direct {name, components} for robustness, but require screen
  let screenRaw: unknown = obj["screen"];
  if (!screenRaw) {
    // If the model returned the screen directly
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

    // Reasonable bounds: allow 0-2000, width/height > 0
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

    // Type-specific validation
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
        // At least one of placeholder/text should exist, but not strict — allow empty
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
      },
    },
  };
}

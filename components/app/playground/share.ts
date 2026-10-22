import { parseBezier } from "./bezier";
import type { ControlDef, ControlValue, PlaygroundItem, Values } from "./core";

/** Query key for the active type. Control keys sit alongside it. */
const TYPE_PARAM = "t";

/** Query string for one type's settings, such as "t=easing&curve=0.23,1,0.32,1&duration=0.25". */
export function encodeState(slug: string, values: Values): string {
  const params = new URLSearchParams({ [TYPE_PARAM]: slug });
  for (const [key, value] of Object.entries(values)) params.set(key, String(value));
  // Commas read better in a shared link than %2C, and are safe in a query value.
  return params.toString().replace(/%2C/g, ",");
}

/** Validate one raw query value against its control. Null means drop it. */
function readControl(control: ControlDef, raw: string): ControlValue | null {
  if (control.kind === "slider") {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return null;
    return Math.min(control.max, Math.max(control.min, n));
  }
  if (control.kind === "select") {
    return control.options.some((option) => option.value === raw) ? raw : null;
  }
  return parseBezier(raw) ? raw : null;
}

/**
 * Read a shared link. Unknown types return null; unknown keys and invalid values
 * are dropped so the type's defaults fill in.
 */
export function decodeState(
  search: string,
  items: readonly PlaygroundItem[],
): { slug: string; values: Values } | null {
  const params = new URLSearchParams(search);
  const item = items.find((it) => it.slug === params.get(TYPE_PARAM));
  if (!item) return null;

  const values: Values = { ...item.defaults };
  for (const control of item.controls) {
    const raw = params.get(control.key);
    if (raw === null) continue;
    const value = readControl(control, raw);
    if (value !== null) values[control.key] = value;
  }
  return { slug: item.slug, values };
}

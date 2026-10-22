import { fmtNum } from "./core";

/** Control points of a CSS cubic-bezier: x1, y1, x2, y2. */
export type Bezier = readonly [number, number, number, number];

/** Vertical room for overshoot. x stays in 0..1 as CSS requires; y may leave it. */
export const Y_MIN = -0.5;
export const Y_MAX = 1.5;

/** Curves from the easing guidance, in order of how often to reach for them. */
export const BEZIER_PRESETS: readonly { label: string; value: Bezier }[] = [
  { label: "Ease out", value: [0.23, 1, 0.32, 1] },
  { label: "Ease out expo", value: [0.19, 1, 0.22, 1] },
  { label: "Drawer", value: [0.32, 0.72, 0, 1] },
  { label: "Ease in out", value: [0.645, 0.045, 0.355, 1] },
  { label: "Ease", value: [0.25, 0.1, 0.25, 1] },
  { label: "Linear", value: [0, 0, 1, 1] },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Keep a point inside the editable range, rounded to two decimals. */
export function clampPoint(x: number, y: number): [number, number] {
  return [+clamp(x, 0, 1).toFixed(2), +clamp(y, Y_MIN, Y_MAX).toFixed(2)];
}

/**
 * Read "x1,y1,x2,y2" or "cubic-bezier(x1, y1, x2, y2)". Returns null for anything
 * else, including x outside 0..1 or y outside the editable range.
 */
export function parseBezier(input: string): Bezier | null {
  const inner = input.trim().replace(/^cubic-bezier\((.*)\)$/i, "$1");
  const parts = inner.split(",").map((part) => part.trim());
  if (parts.length !== 4 || parts.some((part) => part === "")) return null;
  const [x1, y1, x2, y2] = parts.map(Number);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
  if (y1 < Y_MIN || y1 > Y_MAX || y2 < Y_MIN || y2 > Y_MAX) return null;
  return [x1, y1, x2, y2];
}

/** The compact "x1,y1,x2,y2" form stored in control values and URLs. */
export function formatBezier(b: Bezier): string {
  return b.map(fmtNum).join(",");
}

/** The CSS function, such as "cubic-bezier(0.23, 1, 0.32, 1)". */
export function cssBezier(b: Bezier): string {
  return `cubic-bezier(${b.map(fmtNum).join(", ")})`;
}

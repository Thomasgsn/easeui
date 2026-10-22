import type { FC } from "react";

/** A single control's current value. */
export type ControlValue = number | string;

/** All control values for one playground type, keyed by control `key`. */
export type Values = Record<string, ControlValue>;

/** A control shown in the playground's controls card. */
export type ControlDef =
  | {
      kind: "slider";
      key: string;
      label: string;
      /** One-line explanation shown under the control. */
      hint?: string;
      min: number;
      max: number;
      step: number;
      unit?: string;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      hint?: string;
      options: { label: string; value: string }[];
    }
  | {
      /** A draggable cubic-bezier editor. The value is "x1,y1,x2,y2". */
      kind: "curve";
      key: string;
      label: string;
      hint?: string;
      /** Named curves shown as one-tap chips under the editor. */
      presets: { label: string; value: string }[];
      /** Control that holds the duration, so the editor's trace dot runs in time with the preview. */
      durationKey?: string;
    };

/** One copyable version of the generated code, such as Motion or CSS. */
export interface Snippet {
  label: string;
  lang: "tsx" | "css" | "js";
  code: string;
}

/**
 * One interface moment in the playground (easing, press, popover...). Adding one
 * is a single module plus a line in `items/index.ts`.
 */
export interface PlaygroundItem {
  slug: string;
  label: string;
  blurb: string;
  controls: ControlDef[];
  defaults: Values;
  /** A real piece of UI driven by the current values. */
  Preview: FC<{ values: Values; replayKey: number }>;
  /** Copy-paste `motion/react` snippet for the current values. */
  toCode: (values: Values) => string;
  /** The same motion for other stacks, shown as extra tabs after Motion. */
  moreFormats?: (values: Values) => Snippet[];
}

/** Read a numeric control value with a fallback. */
export function num(values: Values, key: string, fallback = 0): number {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
}

/** Read a string control value with a fallback. */
export function str(values: Values, key: string, fallback = ""): string {
  const value = values[key];
  return typeof value === "string" ? value : fallback;
}

/** Format a number for generated code, trimming float noise. */
export const fmtNum = (n: number) => +n.toFixed(3);

import { describe, expect, test } from "bun:test";
import {
  clampPoint,
  cssBezier,
  formatBezier,
  parseBezier,
} from "@/components/app/playground/bezier";
import type { PlaygroundItem } from "@/components/app/playground/core";
import { decodeState, encodeState } from "@/components/app/playground/share";

describe("parseBezier", () => {
  test("reads the compact and CSS forms", () => {
    expect(parseBezier("0.23,1,0.32,1")).toEqual([0.23, 1, 0.32, 1]);
    expect(parseBezier("cubic-bezier(0.23, 1, 0.32, 1)")).toEqual([0.23, 1, 0.32, 1]);
  });

  test("allows y overshoot but keeps x inside 0..1", () => {
    expect(parseBezier("0.3,1.4,0.6,-0.4")).toEqual([0.3, 1.4, 0.6, -0.4]);
    expect(parseBezier("1.2,0,0.5,1")).toBeNull();
    expect(parseBezier("0.2,2,0.5,1")).toBeNull();
  });

  test("rejects malformed input", () => {
    expect(parseBezier("")).toBeNull();
    expect(parseBezier("0.2,0.3,0.4")).toBeNull();
    expect(parseBezier("0.2,,0.4,1")).toBeNull();
    expect(parseBezier("a,b,c,d")).toBeNull();
  });
});

describe("bezier formatting", () => {
  test("round-trips through the compact form", () => {
    const curve = [0.645, 0.045, 0.355, 1] as const;
    expect(parseBezier(formatBezier(curve))).toEqual(curve);
    expect(cssBezier(curve)).toBe("cubic-bezier(0.645, 0.045, 0.355, 1)");
  });

  test("clampPoint keeps a dragged handle in range", () => {
    expect(clampPoint(-0.2, 3)).toEqual([0, 1.5]);
    expect(clampPoint(0.12345, 0.5)).toEqual([0.12, 0.5]);
  });
});

const ITEM: PlaygroundItem = {
  slug: "easing",
  label: "Easing",
  blurb: "",
  controls: [
    { kind: "curve", key: "curve", label: "Curve", presets: [] },
    { kind: "slider", key: "duration", label: "Duration", min: 0.05, max: 1, step: 0.05 },
    {
      kind: "select",
      key: "compare",
      label: "Compare",
      options: [
        { label: "None", value: "none" },
        { label: "Linear", value: "linear" },
      ],
    },
  ],
  defaults: { curve: "0.23,1,0.32,1", duration: 0.25, compare: "none" },
  Preview: () => null,
  toCode: () => "",
};

describe("share links", () => {
  test("round-trip a type's settings", () => {
    const values = { curve: "0.32,0.72,0,1", duration: 0.4, compare: "linear" };
    const query = encodeState("easing", values);
    expect(query).toContain("curve=0.32,0.72,0,1");
    expect(decodeState(query, [ITEM])).toEqual({ slug: "easing", values });
  });

  test("ignores links for unknown types", () => {
    expect(decodeState("t=nope&duration=0.3", [ITEM])).toBeNull();
    expect(decodeState("", [ITEM])).toBeNull();
  });

  test("drops invalid values and clamps sliders", () => {
    const decoded = decodeState(
      "t=easing&curve=5,5,5,5&duration=9&compare=evil&extra=1",
      [ITEM],
    );
    expect(decoded?.values).toEqual({ curve: "0.23,1,0.32,1", duration: 1, compare: "none" });
  });
});

"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { BEZIER_PRESETS, type Bezier, cssBezier, formatBezier, parseBezier } from "../bezier";
import { fmtNum, num, type PlaygroundItem, str, type Values } from "../core";
import { TravelPreview } from "./travel-preview";

const DEFAULT_CURVE = BEZIER_PRESETS[0].value;
const NO_COMPARE = "none";

const PRESET_OPTIONS = BEZIER_PRESETS.map((p) => ({ label: p.label, value: formatBezier(p.value) }));

const curveOf = (values: Values): Bezier => parseBezier(str(values, "curve")) ?? DEFAULT_CURVE;
const durationOf = (values: Values) => num(values, "duration", 0.25);

function Lane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function TweenPreview({ values, replayKey }: { values: Values; replayKey: number }) {
  const reduce = useReducedMotion();
  const duration = durationOf(values);
  const compare = str(values, "compare", NO_COMPARE);
  const compareCurve = compare === NO_COMPARE ? null : parseBezier(compare);
  const compareLabel = PRESET_OPTIONS.find((o) => o.value === compare)?.label ?? "Compare";
  const transitionFor = (ease: Bezier) => (reduce ? { duration: 0 } : { duration, ease });

  if (!compareCurve) {
    return <TravelPreview replayKey={replayKey} transition={transitionFor(curveOf(values))} />;
  }
  return (
    <div className="flex flex-col gap-8">
      <Lane label="Yours">
        <TravelPreview replayKey={replayKey} transition={transitionFor(curveOf(values))} />
      </Lane>
      <Lane label={compareLabel}>
        <TravelPreview
          replayKey={replayKey}
          transition={transitionFor(compareCurve)}
          className="bg-muted-foreground/40"
        />
      </Lane>
    </div>
  );
}

const ms = (values: Values) => Math.round(durationOf(values) * 1000);

export const tweenItem: PlaygroundItem = {
  slug: "easing",
  label: "Easing",
  blurb:
    "Drag the handles to shape your own curve. Use ease-out for things entering or leaving, ease-in-out for things moving on screen, and ease for hover and color changes.",
  controls: [
    {
      kind: "curve",
      key: "curve",
      label: "Curve",
      hint: "Drag a handle, click to pull the nearest one over, or nudge a focused handle with the arrow keys.",
      presets: PRESET_OPTIONS,
      durationKey: "duration",
    },
    {
      kind: "slider",
      key: "duration",
      label: "Duration",
      hint: "Most interface motion lands between 150 and 300ms.",
      min: 0.05,
      max: 1,
      step: 0.05,
      unit: "s",
    },
    {
      kind: "select",
      key: "compare",
      label: "Compare with",
      hint: "Race your curve against a known one at the same duration.",
      options: [{ label: "Nothing", value: NO_COMPARE }, ...PRESET_OPTIONS],
    },
  ],
  defaults: { curve: formatBezier(DEFAULT_CURVE), duration: 0.25, compare: NO_COMPARE },
  Preview: TweenPreview,
  toCode: (v) => `import { motion } from "motion/react";

export function Demo() {
  return (
    <motion.div
      animate={{ x: 120 }}
      transition={{
        duration: ${fmtNum(durationOf(v))},
        ease: [${curveOf(v).map(fmtNum).join(", ")}],
      }}
    />
  );
}`,
  moreFormats: (v) => [
    {
      label: "CSS",
      lang: "css",
      code: `.box {
  transition: transform ${ms(v)}ms ${cssBezier(curveOf(v))};
}

.box[data-open="true"] {
  transform: translateX(120px);
}`,
    },
    {
      label: "Tailwind",
      lang: "tsx",
      code: `// Inline, no config needed
<div className="transition-transform duration-${ms(v)} ease-[${cssBezier(curveOf(v)).replace(/ /g, "")}]" />

// Or name it once in your CSS and reuse it
// @theme { --ease-custom: ${cssBezier(curveOf(v))}; }
<div className="transition-transform duration-${ms(v)} ease-custom" />`,
    },
    {
      label: "GSAP",
      lang: "js",
      code: `import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

gsap.to(".box", {
  x: 120,
  duration: ${fmtNum(durationOf(v))},
  ease: CustomEase.create("custom", "${formatBezier(curveOf(v))}"),
});`,
    },
  ],
};

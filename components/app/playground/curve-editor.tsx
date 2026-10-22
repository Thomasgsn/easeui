"use client";

import { motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type Bezier, clampPoint, formatBezier, parseBezier, Y_MAX, Y_MIN } from "./bezier";

/** Plot units per 1.0 of progress. Everything inside the SVG is drawn in these. */
const UNIT = 100;
/** Room around the plot so handles at the edge are still easy to grab. */
const PAD = 8;
const HEIGHT = (Y_MAX - Y_MIN) * UNIT;

const toSvgY = (y: number) => (Y_MAX - y) * UNIT;

type HandleIndex = 0 | 1;

interface CurveEditorProps {
  /** Current curve as "x1,y1,x2,y2". */
  value: string;
  onChange: (value: string) => void;
  presets: { label: string; value: string }[];
  /** Seconds for the trace dot to run along the curve. */
  duration: number;
  /** Bumps whenever the preview replays, so the dot replays with it. */
  replayKey: number;
  label: string;
}

/**
 * A cubic-bezier editor. Drag either handle, click anywhere to pull the nearest
 * one over, or focus a handle and nudge it with the arrow keys.
 */
export function CurveEditor({
  value,
  onChange,
  presets,
  duration,
  replayKey,
  label,
}: CurveEditorProps) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<HandleIndex | null>(null);
  const curve: Bezier = parseBezier(value) ?? [0.23, 1, 0.32, 1];
  const [x1, y1, x2, y2] = curve;

  const setHandle = (index: HandleIndex, x: number, y: number) => {
    const [cx, cy] = clampPoint(x, y);
    onChange(formatBezier(index === 0 ? [cx, cy, x2, y2] : [x1, y1, cx, cy]));
  };

  /** Pointer position in curve space (x and y as progress). */
  const pointFrom = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: p.x / UNIT, y: Y_MAX - p.y / UNIT };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const p = pointFrom(event);
    if (!p) return;
    const near0 = Math.hypot(p.x - x1, p.y - y1);
    const near1 = Math.hypot(p.x - x2, p.y - y2);
    const index: HandleIndex = near0 <= near1 ? 0 : 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(index);
    setHandle(index, p.x, p.y);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const p = pointFrom(event);
    if (p) setHandle(dragging, p.x, p.y);
  };

  const onKeyDown = (index: HandleIndex) => (event: KeyboardEvent<SVGCircleElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const [hx, hy] = index === 0 ? [x1, y1] : [x2, y2];
    setHandle(index, hx + move[0], hy + move[1]);
  };

  const path = `M0,${toSvgY(0)} C${x1 * UNIT},${toSvgY(y1)} ${x2 * UNIT},${toSvgY(y2)} ${UNIT},${toSvgY(1)}`;
  const current = formatBezier(curve);

  return (
    <div className="flex flex-col gap-4">
      <svg
        ref={svgRef}
        viewBox={`${-PAD} ${-PAD} ${UNIT + PAD * 2} ${HEIGHT + PAD * 2}`}
        aria-label={`${label} editor`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
        className={cn(
          "mx-auto w-full max-w-56 touch-none select-none overflow-visible",
          dragging === null ? "cursor-crosshair" : "cursor-grabbing",
        )}
      >
        {/* The unit square: start at bottom left, end at top right. */}
        <rect
          x={0}
          y={toSvgY(1)}
          width={UNIT}
          height={UNIT}
          rx={2}
          className="fill-muted/50 stroke-border"
          strokeWidth={0.5}
        />
        <line
          x1={0}
          y1={toSvgY(0)}
          x2={UNIT}
          y2={toSvgY(1)}
          className="stroke-border"
          strokeWidth={0.5}
          strokeDasharray="2 2"
        />

        <line x1={0} y1={toSvgY(0)} x2={x1 * UNIT} y2={toSvgY(y1)} className="stroke-muted-foreground" strokeWidth={0.6} />
        <line x1={UNIT} y1={toSvgY(1)} x2={x2 * UNIT} y2={toSvgY(y2)} className="stroke-muted-foreground" strokeWidth={0.6} />
        <path d={path} fill="none" className="stroke-foreground" strokeWidth={1.75} strokeLinecap="round" />

        {reduce ? null : (
          <motion.circle
            key={replayKey}
            r={2.5}
            className="fill-primary"
            initial={{ cx: 0, cy: toSvgY(0) }}
            animate={{ cx: UNIT, cy: toSvgY(1) }}
            transition={{
              cx: { duration, ease: "linear" },
              cy: { duration, ease: curve },
            }}
          />
        )}

        {([0, 1] as const).map((index) => {
          const [hx, hy] = index === 0 ? [x1, y1] : [x2, y2];
          return (
            <g key={index} transform={`translate(${hx * UNIT} ${toSvgY(hy)})`}>
              {/* Larger invisible ring so the handle is easy to hit on touch. */}
              <circle r={9} className="fill-transparent" />
              <circle
                r={4}
                tabIndex={0}
                role="slider"
                aria-label={`Handle ${index + 1}`}
                aria-valuemin={Y_MIN}
                aria-valuemax={Y_MAX}
                aria-valuenow={hy}
                aria-valuetext={`x ${hx}, y ${hy}`}
                onKeyDown={onKeyDown(index)}
                className={cn(
                  "fill-background stroke-foreground outline-none transition-[r] duration-150 ease-out focus-visible:stroke-primary",
                  dragging === index && "stroke-primary",
                )}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-4 gap-2">
        {(["x1", "y1", "x2", "y2"] as const).map((name, i) => (
          <label key={name} className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            {name}
            <input
              type="number"
              inputMode="decimal"
              step={0.01}
              min={i % 2 === 0 ? 0 : Y_MIN}
              max={i % 2 === 0 ? 1 : Y_MAX}
              value={curve[i]}
              onChange={(event) => {
                const n = Number(event.target.value);
                if (event.target.value === "" || !Number.isFinite(n)) return;
                const next = [...curve] as [number, number, number, number];
                next[i] = n;
                const handle: HandleIndex = i < 2 ? 0 : 1;
                setHandle(handle, next[handle * 2], next[handle * 2 + 1]);
              }}
              className="h-8 w-full rounded-md bg-background px-2 font-mono text-xs tabular-nums text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--border-strong)]"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const active = preset.value === current;
          return (
            <button
              key={preset.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(preset.value)}
              className={cn(
                "min-h-8 touch-manipulation rounded-full px-3 text-xs transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97]",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

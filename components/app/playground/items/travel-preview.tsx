"use client";

import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

const TRAVEL = 168;
const BOX = 48;

/** Shared subject for time and physics types: a box travels a fixed distance. */
export function TravelPreview({
  transition,
  replayKey,
  className,
}: {
  transition: Transition;
  replayKey: number;
  /** Overrides the box fill, such as a muted color for a comparison lane. */
  className?: string;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative h-12" style={{ width: TRAVEL + BOX }}>
        <motion.div
          key={replayKey}
          initial={{ x: 0 }}
          animate={{ x: TRAVEL }}
          transition={transition}
          className={cn("absolute left-0 top-0 h-12 w-12 rounded-xl bg-primary", className)}
        />
      </div>
    </div>
  );
}

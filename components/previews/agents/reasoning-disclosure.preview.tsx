"use client";

import { RotateCcw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/motion/button";
import { ReasoningDisclosure } from "@/components/motion/reasoning-disclosure";
import { StreamingText } from "@/components/motion/streaming-text";

const REASONING =
  "The user wants the cheapest way to cache this endpoint. It's read heavy and the data changes about once an hour. A CDN cache with a one hour max-age would work, but invalidating after a write matters more than raw speed here. Tagging responses and purging the tag on write keeps it fresh without a short TTL.";
const ANSWER =
  "Cache it at the CDN with a long max-age and tag each response. When the data changes, purge that tag, so readers never wait on a stale copy.";
/** Characters per second for each phase. */
const THINK_SPEED = 90;
const ANSWER_SPEED = 60;

function useTyped(text: string, speed: number, start: boolean, run: number) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  // run is never read; bumping it is what restarts the typing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run is intentional, see comment above.
  useEffect(() => {
    setCount(0);
    if (!start) return;
    if (reduce) {
      setCount(text.length);
      return;
    }
    const startedAt = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const next = Math.min(text.length, Math.floor(((now - startedAt) / 1000) * speed));
      setCount(next);
      if (next < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, speed, start, reduce, run]);

  return count;
}

export function ReasoningDisclosurePreview() {
  const [run, setRun] = useState(0);
  const thought = useTyped(REASONING, THINK_SPEED, true, run);
  const thinking = thought < REASONING.length;
  const answered = useTyped(ANSWER, ANSWER_SPEED, !thinking, run);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ReasoningDisclosure key={run} status={thinking ? "thinking" : "done"}>
        {REASONING.slice(0, thought)}
      </ReasoningDisclosure>
      {thinking ? null : <StreamingText text={ANSWER.slice(0, answered)} streaming={answered < ANSWER.length} />}
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRun((r) => r + 1)}>
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Replay
        </Button>
      </div>
    </div>
  );
}

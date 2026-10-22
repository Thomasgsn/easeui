"use client";

import { useState } from "react";
import { Rating } from "./rating";

const WORDS = ["Tap a star", "Not for me", "Could be better", "Pretty good", "Really good", "Love it"];

export default function RatingDemo() {
  const [value, setValue] = useState(4);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Order #4821 delivered</p>
        <h3 className="mt-1 text-lg font-semibold">How was everything?</h3>
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl bg-muted/60 py-6">
          <Rating value={value} onValueChange={setValue} size="lg" label="Rate your order" />
          <p className="h-5 text-sm text-muted-foreground">{WORDS[value]}</p>
        </div>
        <button
          type="button"
          className="mt-5 h-10 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Send review
        </button>
      </div>
    </div>
  );
}

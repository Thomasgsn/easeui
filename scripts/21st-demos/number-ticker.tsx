"use client";

import { useEffect, useState } from "react";
import { NumberTicker } from "./number-ticker";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function NumberTickerDemo() {
  const [value, setValue] = useState(48290);

  // A new sale lands every couple of seconds, so the digits keep rolling.
  useEffect(() => {
    const id = window.setInterval(() => setValue((v) => v + 120 + Math.floor(Math.random() * 900)), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Revenue today</p>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        </div>
        <div className="mt-3 text-5xl font-semibold tracking-tight">
          <NumberTicker value={value} format={money} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Each new sale rolls only the digits that change.</p>
      </div>
    </div>
  );
}

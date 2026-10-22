"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/app/docs/copy-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { cn } from "@/lib/utils";
import type { Snippet } from "./core";

/**
 * Generated snippets with syntax highlighting, one tab per format. The plain code
 * renders first and the highlighted version swaps in once shiki loads, so the
 * layout never jumps.
 */
export function CodePanel({ snippets, className }: { snippets: Snippet[]; className?: string }) {
  const [format, setFormat] = useState(snippets[0]?.label ?? "");
  // Fall back to the first format when the active type doesn't offer the chosen one.
  const snippet = snippets.find((s) => s.label === format) ?? snippets[0];
  const [html, setHtml] = useState<string | null>(null);

  const code = snippet?.code ?? "";
  const lang = snippet?.lang ?? "tsx";

  useEffect(() => {
    let active = true;
    // The last highlight stays up until the new one lands, so dragging a
    // control doesn't flicker between plain and highlighted code.
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang,
          themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
          defaultColor: false,
        }),
      )
      .then((highlighted) => {
        if (active) setHtml(highlighted);
      })
      .catch((error: unknown) => {
        // Highlighting is an enhancement. The plain code stays visible if it fails.
        console.warn("Code highlighting failed", error);
      });
    return () => {
      active = false;
    };
  }, [code, lang]);

  if (!snippet) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card font-mono text-[13px] leading-relaxed",
        className,
      )}
    >
      {snippets.length > 1 ? (
        <div className="flex items-center border-b border-border px-3 py-2 font-sans">
          <Tabs value={snippet.label} onValueChange={setFormat} variant="segment">
            <TabsList>
              {snippets.map((s) => (
                <TabsTrigger key={s.label} value={s.label}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      <div className="relative">
        <div className="absolute right-3 top-3 z-10">
          <CopyButton text={snippet.code} eventName="copy_playground" eventLabel={snippet.label} />
        </div>
        {html ? (
          <div
            className="py-4 [&_.line]:px-5 [&_pre]:overflow-x-auto [&_pre]:!bg-transparent"
            // Generated from our own snippet templates, not user input.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="overflow-x-auto px-5 py-4 text-foreground">
            <code>{snippet.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

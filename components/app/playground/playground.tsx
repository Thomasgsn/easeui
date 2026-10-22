"use client";

import { ArrowUpRight, RotateCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { proUrl } from "@/lib/site";
import { CodePanel } from "./code-panel";
import { Controls } from "./controls";
import type { ControlValue, Snippet, Values } from "./core";
import { PLAYGROUND_ITEMS } from "./items";
import { decodeState, encodeState } from "./share";
import { ShareLinkButton } from "./share-link-button";

/** Wait this long after the last change before replaying the preview. */
const REPLAY_DELAY_MS = 250;

const DEFAULT_QUERY = encodeState(PLAYGROUND_ITEMS[0].slug, PLAYGROUND_ITEMS[0].defaults);

const iconButton =
  "inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-full text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.97]";

export function Playground() {
  const [activeSlug, setActiveSlug] = useState(PLAYGROUND_ITEMS[0].slug);
  const [replayKey, setReplayKey] = useState(0);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // per-type values so switching types preserves each one's tweaks
  const [valuesByType, setValuesByType] = useState<Record<string, Values>>(() =>
    Object.fromEntries(
      PLAYGROUND_ITEMS.map((it) => [it.slug, { ...it.defaults }]),
    ),
  );

  // Open a shared link. Read after mount so the server render and hydration match.
  useEffect(() => {
    const shared = decodeState(window.location.search, PLAYGROUND_ITEMS);
    if (!shared) return;
    setActiveSlug(shared.slug);
    setValuesByType((prev) => ({ ...prev, [shared.slug]: shared.values }));
    setReplayKey((k) => k + 1);
  }, []);

  useEffect(
    () => () => {
      if (replayTimer.current) clearTimeout(replayTimer.current);
    },
    [],
  );

  const active = useMemo(
    () =>
      PLAYGROUND_ITEMS.find((it) => it.slug === activeSlug) ??
      PLAYGROUND_ITEMS[0],
    [activeSlug],
  );
  const values = valuesByType[active.slug];
  const query = encodeState(active.slug, values);

  // Keep the address bar in step, so a copied URL opens these exact settings.
  // Untouched defaults keep the plain /playground URL.
  useEffect(() => {
    const next = query === DEFAULT_QUERY ? window.location.pathname : `?${query}`;
    window.history.replaceState(null, "", next);
  }, [query]);

  const snippets: Snippet[] = [
    { label: "Motion", lang: "tsx", code: active.toCode(values) },
    ...(active.moreFormats?.(values) ?? []),
  ];

  const replay = () => setReplayKey((k) => k + 1);

  const select = (slug: string) => {
    setActiveSlug(slug);
    replay();
  };

  const setValue = (key: string, value: ControlValue) => {
    // strip float artifacts from step snapping (0.30000000000000004 -> 0.3)
    const clean =
      typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value;
    setValuesByType((prev) => {
      const merged = { ...prev[active.slug], [key]: clean };
      return { ...prev, [active.slug]: merged };
    });
    // Replay once the value settles. Restarting on every slider tick made the
    // preview stutter while dragging.
    if (replayTimer.current) clearTimeout(replayTimer.current);
    replayTimer.current = setTimeout(replay, REPLAY_DELAY_MS);
  };

  const reset = () => {
    setValuesByType((prev) => ({ ...prev, [active.slug]: { ...active.defaults } }));
    replay();
  };

  const Preview = active.Preview;

  return (
    <div className="flex w-full flex-col gap-10 pb-24 pt-10 md:pt-14">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Playground
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
          Shape the motion behind everyday interface moments, then copy it as
          Motion, CSS, Tailwind or GSAP, or share the exact settings as a link.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <Tabs value={active.slug} onValueChange={select} variant="underline">
          {/* Scrolls sideways on narrow screens instead of wrapping. */}
          <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
            <TabsList className="flex w-full min-w-max sm:justify-center">
              {PLAYGROUND_ITEMS.map((it) => (
                <TabsTrigger
                  key={it.slug}
                  value={it.slug}
                  className="touch-manipulation"
                >
                  {it.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <p className="mx-auto max-w-2xl text-pretty text-center text-sm leading-6 text-muted-foreground">
          {active.blurb}
        </p>
      </div>

      {/* Preview and code on the left, controls on the right like a design tool.
          Stacks on narrow screens. min-w-0 lets code scroll instead of widening the page. */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Tall enough for scaled previews. Clips only sideways so vertical
              overshoot is never cut off. */}
          <section className="relative flex min-h-[26rem] w-full items-center justify-center overflow-x-clip rounded-2xl bg-card px-6 py-16 [&>div:first-child]:w-full">
            <div>
              <Preview values={values} replayKey={replayKey} />
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1">
              <ShareLinkButton query={query} slug={active.slug} className={iconButton} />
              <button
                type="button"
                onClick={replay}
                aria-label="Replay animation"
                className={iconButton}
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="order-last flex w-full min-w-0 flex-col gap-3 lg:order-none">
            <CodePanel snippets={snippets} />
            <a
              href={proUrl("", "playground")}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Want this motion already built into full pages? See easeUI Pro
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </a>
          </section>
        </div>

        <section className="flex w-full flex-col gap-5 self-start rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <Controls
            controls={active.controls}
            values={values}
            onChange={setValue}
            replayKey={replayKey}
          />
          <button
            type="button"
            onClick={reset}
            className="self-start text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Reset to defaults
          </button>
        </section>
      </div>
    </div>
  );
}

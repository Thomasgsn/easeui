"use client";

import { Check, Link2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const EASE = [0.23, 1, 0.32, 1] as const;
/** How long the check mark stays before the link icon returns, in ms. */
const CONFIRM_MS = 1500;

/** Copies a link that reopens the playground with the current settings. */
export function ShareLinkButton({
  query,
  slug,
  className,
}: {
  query: string;
  slug: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be denied. The icon stays as a link so nothing claims success.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS);
    trackEvent("share_playground", { label: slug });
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copied" : "Copy link to these settings"}
      className={className}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "check" : "link"}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6, transition: { duration: reduce ? 0 : 0.1, ease: EASE } }}
          transition={{ duration: reduce ? 0 : 0.15, ease: EASE }}
          className="inline-flex"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-4 w-4 text-(--color-success)" />
          ) : (
            <Link2 aria-hidden="true" className="h-4 w-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// Builds 21st.dev uploads for a hand-picked set of free components into 21st-export/<slug>/.
// Each component becomes one self-contained file: motion tokens are inlined and a credit line points
// back to easeui.dev. Demos swap the site's Button for plain buttons so they stand alone.
//
//   bun scripts/build-21st.ts
//   npx @21st-dev/cli publish 21st-export/rating/rating.tsx --demo 21st-export/rating/demo.tsx --description "…"

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "21st-export";

export const PICKS: { slug: string; description: string; tags: string[] }[] = [
  { slug: "rating", description: "Star rating that previews the score on hover and fills in a quick wave. Native radios, so arrow keys work. From easeUI, easeui.dev", tags: ["rating", "stars", "form"] },
  { slug: "tag-input", description: "Tag input. Enter or a comma adds a tag, Backspace marks then removes the last, duplicates shake. From easeUI, easeui.dev", tags: ["input", "tags", "chips", "form"] },
  { slug: "morphing-search", description: "A search button that morphs into a text field, the same element growing and reshaping. From easeUI, easeui.dev", tags: ["search", "input", "morph", "animation"] },
  { slug: "hold-to-confirm", description: "Hold to confirm button for destructive actions. It fills while held and drains back if you let go early. From easeUI, easeui.dev", tags: ["button", "confirm", "destructive"] },
  { slug: "expandable-tabs", description: "Icon tabs where the selected one expands to show its label, with a shared pill gliding between them. From easeUI, easeui.dev", tags: ["tabs", "navigation", "animation"] },
  { slug: "stepper", description: "Numbered steps joined by a line that fills as you advance. Finished steps show a check and can be clicked to go back. From easeUI, easeui.dev", tags: ["stepper", "steps", "onboarding", "progress"] },
  { slug: "number-ticker", description: "A number that rolls each changed digit like an odometer, at a fixed width so nothing shifts. From easeUI, easeui.dev", tags: ["number", "counter", "ticker", "animation"] },
];

const CREDIT = (slug: string) => `// From easeUI, free and open source under MIT. Docs and more components at https://easeui.dev/components/motion/${slug}\n`;

// Source files may use Windows line endings, so everything is read as plain newlines.
const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// The motion tokens, as standalone constants, keyed by export name.
const ease = read("lib/ease.ts");
function token(name: string): string {
  const match = ease.match(new RegExp(`export const ${name}[^;]*;`, "s"));
  if (!match) throw new Error(`Unknown motion token ${name}`);
  return match[0].replace("export const", "const");
}

function inlineTokens(source: string): string {
  const imported = source.match(/import \{([^}]+)\} from "@\/lib\/ease";\n/);
  if (!imported) return source;
  const names = imported[1].split(",").map((n) => n.trim()).filter(Boolean);
  const consts = names.map(token).join("\n");
  return source.replace(imported[0], "").replace(/(import[^\n]*\n)(?![\s\S]*import )/, `$1\n${consts}\n`);
}

// 21st renders with the stock shadcn theme. easeUI's own colors don't exist there, so they map to
// shadcn's: the pink accent becomes primary, the strong hairline is mixed from foreground, and warning
// becomes amber. The site keeps its own colors; only the export changes.
const THEME: [RegExp, string][] = [
  // Underscores, not spaces: these land inside Tailwind arbitrary values, where a space ends the class.
  [/var\(--border-strong\)/g, "color-mix(in_oklch,var(--foreground)_14%,transparent)"],
  // shadcn's card is pure white, so on 21st's white canvas easeUI's card surfaces use muted instead.
  [/\bbg-card\b/g, "bg-muted"],
  [/var\(--accent\)/g, "var(--primary)"],
  [/\btext-accent-foreground\b/g, "text-primary-foreground"],
  [/\bbg-accent\b/g, "bg-primary"],
  [/\bfill-warning\b/g, "fill-amber-400"],
  [/\btext-warning\b/g, "text-amber-400"],
  [/\bbg-warning\b/g, "bg-amber-400"],
  [/\bbg-success\b/g, "bg-emerald-500"],
  [/\btext-success\b/g, "text-emerald-500"],
];
// Small changes so each catalog thumbnail shows the component doing something, not its empty state.
const THUMBNAIL: Record<string, (demo: string) => string> = {
  rating: (d) => d.replace("useState(0)", "useState(4)"),
};

const toShadcn = (source: string) => THEME.reduce((text, [from, to]) => text.replace(from, to), source);

const BUTTON = (variant: "primary" | "secondary") =>
  variant === "primary"
    ? "inline-flex h-8 items-center rounded-full bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
    : "inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-40";

function plainButtons(demo: string): string {
  return demo
    .replace(/import \{ Button \} from "@\/components\/motion\/button";\n/, "")
    .replace(/<Button variant="secondary" size="sm"/g, `<button type="button" className="${BUTTON("secondary")}"`)
    .replace(/<Button size="sm"/g, `<button type="button" className="${BUTTON("primary")}"`)
    .replace(/<\/Button>/g, "</button>");
}

rmSync(OUT, { recursive: true, force: true });
for (const { slug } of PICKS) {
  const code = CREDIT(slug) + inlineTokens(read(`components/motion/${slug}.tsx`));
  const demo = plainButtons(read(`components/previews/motion/${slug}.preview.tsx`)).replace(
    `@/components/motion/${slug}`,
    // A relative import the 21st tool rewrites to wherever it stores the component.
    `./${slug}`,
  );
  if (/@\/components\/motion\/|@\/lib\/ease/.test(code + demo)) throw new Error(`${slug} still imports site code`);
  // 21st loads each demo as its only export, a default function.
  if (!/export function \w+/.test(demo)) throw new Error(`${slug} demo has no exported component`);
  // A hand-made showcase demo wins over the site preview: it fills the thumbnail and shows the component in a real context.
  const showcase = `scripts/21st-demos/${slug}.tsx`;
  const demoFile = existsSync(showcase)
    ? read(showcase)
    : (THUMBNAIL[slug] ?? ((d: string) => d))(demo.replace(/export function (\w+)/, "export default function $1"));
  mkdirSync(join(OUT, slug), { recursive: true });
  // 21st names the component after its file, which the demo imports by that name.
  writeFileSync(join(OUT, slug, `${slug}.tsx`), toShadcn(code));
  writeFileSync(join(OUT, slug, "demo.tsx"), toShadcn(demoFile));
}
writeFileSync(join(OUT, "picks.json"), JSON.stringify(PICKS, null, 2));
console.log(`Wrote ${PICKS.length} components to ${OUT}/`);

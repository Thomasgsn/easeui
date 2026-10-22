// Builds 21st.dev uploads for the free blocks in scripts/21st-blocks into 21st-export/<slug>/.
// A block imports free components from @/components/motion; 21st takes one file, so every component
// it uses is inlined into that file, with a credit line pointing back to easeui.dev.
//
//   bun scripts/build-21st-blocks.ts

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const SRC = "scripts/21st-blocks";
const OUT = "21st-export";

export const BLOCKS: { slug: string; name: string; description: string; tags: string[] }[] = [
  {
    slug: "agent-run",
    name: "Agent Run",
    description:
      "An AI agent run in one panel. A live task plan, tool calls that tick off, an approval step for risky commands, and a streamed answer. Built from free easeUI components, easeui.dev",
    tags: ["ai", "agent", "chat", "block"],
  },
  {
    slug: "onboarding-flow",
    name: "Onboarding Flow",
    description:
      "Three step workspace setup with a live preview that updates as you type. Stepper, inputs, select, tag input and switches. Built from free easeUI components, easeui.dev",
    tags: ["onboarding", "form", "stepper", "block"],
  },
  {
    slug: "revenue-dashboard",
    name: "Revenue Dashboard",
    description:
      "A live revenue overview. Rolling number tickers, a range switcher, an animated area chart and a payments table that fills in as sales land. Built from free easeUI components, easeui.dev",
    tags: ["dashboard", "analytics", "chart", "block"],
  },
  {
    slug: "account-settings",
    name: "Account Settings",
    description:
      "An account settings page with a save bar that slides up on changes, notification switches, usage meters and a hold to delete danger zone. Built from free easeUI components, easeui.dev",
    tags: ["settings", "account", "form", "block"],
  },
  {
    slug: "sign-in-otp",
    name: "Sign In With Code",
    description:
      "Two step sign in. Email first, then a six digit code that verifies itself, with a resend timer and a smooth height glide between steps. Built from free easeUI components, easeui.dev",
    tags: ["auth", "login", "otp", "block"],
  },
  {
    slug: "mobile-app",
    name: "Mobile App Shell",
    description:
      "A phone app shell with a Dynamic Island that reacts to events, pull to refresh on the feed and an expanding tab bar. Built from free easeUI components, easeui.dev",
    tags: ["mobile", "app", "navigation", "block"],
  },
];

const CREDIT = (slug: string) =>
  `// From easeUI, free and open source under MIT. Built only from free easeUI components, see https://easeui.dev\n// Block: ${slug}\n`;

const MOTION = "@/components/motion/";

// 21st renders with the stock shadcn theme, so easeUI's own colors map to shadcn's. Underscores, not
// spaces, inside arbitrary values, where a space would end the class.
const THEME: [RegExp, string][] = [
  [/var\(--border-strong\)/g, "color-mix(in_oklch,var(--foreground)_14%,transparent)"],
  [/\bborder-border-strong\b/g, "border-foreground/15"],
  [/var\(--accent\)/g, "var(--primary)"],
  [/\btext-accent-foreground\b/g, "text-primary-foreground"],
  [/\b(bg|text|border|ring|fill|stroke|from|to)-accent\b/g, "$1-primary"],
  [/var\(--success\)/g, "var(--color-emerald-500)"],
  [/var\(--warning\)/g, "var(--color-amber-500)"],
  [/\b(bg|text|fill|stroke|ring)-success\b/g, "$1-emerald-500"],
  [/\b(bg|text|fill|stroke|ring)-warning\b/g, "$1-amber-500"],
  [/ ?\bfont-display\b/g, ""],
];

const DOM_TYPES = ["PointerEvent", "KeyboardEvent", "MouseEvent", "FocusEvent", "DragEvent", "TouchEvent", "WheelEvent", "ClipboardEvent", "AnimationEvent", "TransitionEvent", "UIEvent"];

const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

interface Imports {
  named: Map<string, Set<string>>;
}

function topLevelNames(statement: ts.Statement): string[] {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((d) => (ts.isIdentifier(d.name) ? [d.name.text] : []));
  }
  if (
    (ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name
  ) {
    return [statement.name.text];
  }
  return [];
}

const pascal = (slug: string) => slug.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
const parse = (path: string, code: string) => ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

// Files in dependency order: a component's own motion imports come before it.
function collect(path: string, order: string[] = [], seen = new Set<string>()): string[] {
  if (seen.has(path)) return order;
  seen.add(path);
  const file = parse(path, read(path));
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const from = (statement.moduleSpecifier as ts.StringLiteral).text;
    if (from.startsWith(MOTION)) collect(`components/motion/${from.slice(MOTION.length)}.tsx`, order, seen);
  }
  order.push(path);
  return order;
}

// Drops inlined helpers nothing else uses, such as AvatarGroup when a block only needs Avatar.
function shake(parts: { names: string[]; text: string; keep: boolean }[]): string[] {
  let live = parts;
  for (;;) {
    const next = live.filter(
      (part) => part.keep || part.names.some((name) => live.some((other) => other !== part && new RegExp(`\\b${name}\\b`).test(other.text))),
    );
    if (next.length === live.length) return next.map((part) => part.text);
    live = next;
  }
}

function bundle(entry: string): string {
  const imports: Imports = { named: new Map() };
  const declared = new Map<string, string>();
  const tokens = new Set<string>();
  const body: { names: string[]; text: string; keep: boolean }[] = [];

  const addImport = (from: string, spec: string) => {
    const set = imports.named.get(from) ?? new Set<string>();
    set.add(spec);
    imports.named.set(from, set);
  };

  const files = collect(entry);

  // Every package import and motion token across the bundle, so a local helper can't shadow one.
  const ease = read("lib/ease.ts");
  const token = (name: string) => {
    const match = ease.match(new RegExp(`export const ${name}\\b[^;]*;`, "s"));
    if (!match) throw new Error(`Unknown motion token ${name}`);
    return match[0].replace("export const ", "const ");
  };
  const imported = new Set<string>();
  for (const path of files) {
    for (const statement of parse(path, read(path)).statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      const from = (statement.moduleSpecifier as ts.StringLiteral).text;
      const bindings = statement.importClause?.namedBindings;
      if (from.startsWith(MOTION) || !bindings || !ts.isNamedImports(bindings)) continue;
      for (const el of bindings.elements) {
        if (from === "@/lib/ease") {
          tokens.add(el.name.text);
          declared.set(el.name.text, token(el.name.text));
        } else imported.add(el.name.text);
      }
    }
  }

  for (const path of files) {
    const isEntry = path === entry;
    // React's event types share names with the DOM's. Merged into one import they would shadow the
    // globals another file relies on, so each is aliased.
    let code = read(path);
    const reactImport = /import (?:type )?\{[^}]*\} from "react";/;
    for (const name of DOM_TYPES) {
      const line = code.match(reactImport)?.[0];
      if (!line || !new RegExp(`\\b${name}\\b(?! as)`).test(line)) continue;
      code = code.replace(new RegExp(`\\b${name}\\b`, "g"), `React${name}`);
      code = code.replace(reactImport, (found) => found.replace(`React${name}`, `${name} as React${name}`));
    }

    // A helper whose name is taken by a different helper, a package import or a motion token gets this file's prefix.
    for (const statement of parse(path, code).statements) {
      for (const name of topLevelNames(statement)) {
        const exported = ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        const text = statement.getText().replace(/^export /, "");
        if ((declared.has(name) && declared.get(name) !== text) || imported.has(name)) {
          if (exported) throw new Error(`${path} exports ${name}, which clashes with another declaration`);
          const prefix = pascal(path.split("/").pop()?.replace(".tsx", "") ?? "File");
          const renamed = /^[A-Z0-9_]+$/.test(name) ? `${prefix.toUpperCase()}_${name}` : `${prefix}${name[0].toUpperCase()}${name.slice(1)}`;
          code = code.replace(new RegExp(`\\b${name}\\b`, "g"), renamed);
        }
      }
    }

    const file = parse(path, code);
    for (const statement of file.statements) {
      if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) continue;
      if (ts.isImportDeclaration(statement)) {
        const from = (statement.moduleSpecifier as ts.StringLiteral).text;
        if (from.startsWith(MOTION)) continue;
        const clause = statement.importClause;
        if (!clause) continue;
        const typeOnly = clause.isTypeOnly;
        if (clause.name) addImport(from, `default:${clause.name.text}`);
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            const name = el.propertyName ? `${el.propertyName.text} as ${el.name.text}` : el.name.text;
            if (from !== "@/lib/ease") addImport(from, typeOnly || el.isTypeOnly ? `type ${name}` : name);
          }
        }
        continue;
      }
      const names = topLevelNames(statement);
      let text = statement.getFullText().replace(/^\n+/, "");
      if (!isEntry) text = text.replace(/^((?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\n)*\s*)export /, "$1");
      const bare = statement.getText().replace(/^export /, "");
      if (names.length && names.every((name) => declared.get(name) === bare)) continue;
      for (const name of names) declared.set(name, bare);
      body.push({ names, text: text.trimEnd(), keep: isEntry || names.length === 0 });
    }
  }

  const code = shake(body).join("\n\n");
  const used = (spec: string) => new RegExp(`\\b${spec.replace(/^(type |default:)/, "").split(" as ").pop()}\\b`).test(code);

  // The motion tokens the shaken code still uses, as standalone constants.
  const consts = [...tokens].filter(used).map(token);

  // A name imported as a value anywhere wins over a type-only import of it.
  const header = [...imports.named.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, specs]) => [...specs].some(used))
    .map(([from, specs]) => {
      const list = [...specs].filter(used);
      const def = list.find((s) => s.startsWith("default:"))?.slice(8);
      const values = new Set(list.filter((s) => !s.startsWith("type ") && !s.startsWith("default:")));
      const types = list.filter((s) => s.startsWith("type ") && !values.has(s.slice(5)));
      const named = [...values, ...types].sort((a, b) => a.replace("type ", "").localeCompare(b.replace("type ", "")));
      const parts = [def, named.length ? `{ ${named.join(", ")} }` : null].filter(Boolean).join(", ");
      return `import ${parts} from "${from}";`;
    })
    .join("\n");

  return `"use client";\n\n${header}\n\n${consts.join("\n")}${consts.length ? "\n\n" : ""}${code}\n`;
}

const toShadcn = (source: string) => THEME.reduce((text, [from, to]) => text.replace(from, to), source);

for (const { slug } of BLOCKS) rmSync(join(OUT, slug), { recursive: true, force: true });
for (const { slug } of BLOCKS) {
  const entry = `${SRC}/${slug}.tsx`;
  if (!existsSync(entry)) throw new Error(`Missing ${entry}`);
  const code = bundle(entry);
  if (/@\/components\/|@\/lib\/ease/.test(code)) throw new Error(`${slug} still imports site code`);
  const demo = read(`${SRC}/demos/${slug}.tsx`).replace(`"../${slug}"`, `"./${slug}"`);
  if (!/export default function \w+/.test(demo)) throw new Error(`${slug} demo needs a default export`);
  mkdirSync(join(OUT, slug), { recursive: true });
  writeFileSync(join(OUT, slug, `${slug}.tsx`), CREDIT(slug) + toShadcn(code));
  writeFileSync(join(OUT, slug, "demo.tsx"), toShadcn(demo));
}
writeFileSync(join(OUT, "blocks.json"), JSON.stringify(BLOCKS, null, 2));
console.log(`Wrote ${BLOCKS.length} blocks to ${OUT}/`);

"use client";

import { ArrowLeft, ArrowRight, Box, Check, Globe, Leaf, Rocket, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarGroup } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Stepper } from "@/components/motion/stepper";
import { Switch } from "@/components/motion/switch";
import { TagInput } from "@/components/motion/tag-input";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface OnboardingValues {
  name: string;
  icon: string;
  use: string;
  invites: string[];
  role: string;
  settings: Record<string, boolean>;
}

export interface OnboardingFlowProps {
  /** Where the workspace lives, shown before its slug. */
  domain?: string;
  /** Answers the form starts with. */
  defaultValues?: Partial<OnboardingValues>;
  /** Called with every answer once the last step is done. */
  onComplete?: (values: OnboardingValues) => void;
  className?: string;
}

const STEPS = [
  { label: "Workspace", description: "Name and look" },
  { label: "Team", description: "Invite people" },
  { label: "Preferences", description: "How it works" },
];

const ICONS: Record<string, ReactNode> = {
  rocket: <Rocket className="h-4 w-4" />,
  leaf: <Leaf className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  globe: <Globe className="h-4 w-4" />,
  box: <Box className="h-4 w-4" />,
};

const USES: Record<string, string> = {
  product: "Product and design",
  engineering: "Engineering",
  marketing: "Marketing",
  agency: "Client work",
};

const SETTINGS = [
  { id: "digest", label: "Weekly summary", description: "A Monday email with what shipped." },
  { id: "slack", label: "Post updates to Slack", description: "New projects land in #general." },
  { id: "twoFactor", label: "Require two factor sign in", description: "For everyone in the workspace." },
];

const FACES = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop",
];

const DEFAULTS: OnboardingValues = {
  name: "Northwind",
  icon: "rocket",
  use: "product",
  invites: ["maya@northwind.co", "leo@northwind.co", "sam@northwind.co"],
  role: "member",
  settings: { digest: true, slack: false, twoFactor: true },
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "your-team";

// Reports an element's height, so the card can glide between steps of different lengths.
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A three step workspace setup with a live preview beside it that changes as you answer. */
export function OnboardingFlow({ domain = "northwind.app", defaultValues, onComplete, className }: OnboardingFlowProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [values, setValues] = useState<OnboardingValues>({ ...DEFAULTS, ...defaultValues });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [bodyRef, bodyHeight] = useHeight<HTMLDivElement>();
  // Clips only while the height glides, so an open select menu can hang past the card.
  const [gliding, setGliding] = useState(false);

  const set = <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const slug = slugify(values.name);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === 0 && !values.name.trim()) {
      setError(true);
      return;
    }
    if (step < STEPS.length - 1) go(step + 1);
    else {
      setDone(true);
      onComplete?.(values);
    }
  };

  const restart = () => {
    setDone(false);
    setDirection(-1);
    setStep(0);
  };

  const offset = reduce ? 0 : 20 * direction;

  return (
    <section className={cn("w-full px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto grid max-w-5xl rounded-3xl bg-background shadow-[0_0_0_1px_var(--border),0_24px_60px_-32px_rgb(0_0_0/0.35)] lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-8 p-6 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Set up your workspace</h2>
            <p className="text-sm text-muted-foreground">Three quick steps. You can change all of it later.</p>
          </div>

          <Stepper steps={STEPS} current={done ? STEPS.length : step} onStepClick={done ? undefined : go} />

          <motion.div
            animate={{ height: bodyHeight }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }}
            onAnimationStart={() => setGliding(true)}
            onAnimationComplete={() => setGliding(false)}
            className={gliding ? "overflow-hidden" : "overflow-visible"}
          >
            <div ref={bodyRef}>
              <AnimatePresence mode="wait" initial={false} custom={offset}>
                {done ? (
                  <motion.div
                    key="done"
                    initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                    className="flex flex-col items-center gap-4 py-10 text-center"
                    role="status"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                      <Check aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-foreground">{values.name || "Your workspace"} is ready</h3>
                      <p className="text-sm text-muted-foreground">
                        {values.invites.length} invites sent. Everyone gets a link to {domain}/{slug}.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={restart}>
                        Start over
                      </Button>
                      <Button>Open workspace</Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key={step}
                    onSubmit={submit}
                    noValidate
                    custom={offset}
                    initial={{ opacity: 0, x: offset }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -offset }}
                    transition={{ duration: reduce ? 0 : 0.18, ease: EASE_OUT }}
                    className="flex flex-col gap-6"
                  >
                    {step === 0 ? (
                      <>
                        <Field label="Workspace name" htmlFor={`${id}-name`} hint={`Lives at ${domain}/${slug}`}>
                          <Input
                            id={`${id}-name`}
                            value={values.name}
                            aria-invalid={error && !values.name.trim()}
                            onChange={(event) => {
                              setError(false);
                              set("name", event.target.value);
                            }}
                            placeholder="Acme Inc"
                          />
                        </Field>
                        <fieldset className="flex flex-col gap-2">
                          <legend className="mb-2 text-sm font-medium text-foreground">Icon</legend>
                          <div className="flex gap-2">
                            {Object.entries(ICONS).map(([key, icon]) => (
                              <button
                                key={key}
                                type="button"
                                aria-pressed={values.icon === key}
                                aria-label={key}
                                onClick={() => set("icon", key)}
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40",
                                  values.icon === key
                                    ? "bg-foreground text-background"
                                    : "shadow-[0_0_0_1px_var(--border-strong)] hover:bg-muted hover:text-foreground",
                                )}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <Field label="What is it for">
                          <Select value={values.use} onValueChange={(value) => set("use", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pick one" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(USES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    ) : step === 1 ? (
                      <>
                        <Field label="Invite by email" hint="Enter or a comma adds someone.">
                          <TagInput
                            value={values.invites}
                            onValueChange={(invites) => set("invites", invites)}
                            placeholder="name@company.com"
                            label="Invites"
                            max={6}
                          />
                        </Field>
                        <Field label="They join as">
                          <Select value={values.role} onValueChange={(value) => set("role", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    ) : (
                      <div className="flex flex-col divide-y divide-border">
                        {SETTINGS.map((setting) => (
                          <label
                            key={setting.id}
                            htmlFor={`${id}-${setting.id}`}
                            className="flex cursor-pointer items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                          >
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground">{setting.label}</span>
                              <span className="text-xs text-muted-foreground">{setting.description}</span>
                            </span>
                            <Switch
                              id={`${id}-${setting.id}`}
                              checked={values.settings[setting.id] ?? false}
                              onCheckedChange={(on) => set("settings", { ...values.settings, [setting.id]: on })}
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit">
                        {step === STEPS.length - 1 ? "Create workspace" : "Continue"}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <Preview values={values} domain={domain} slug={slug} />
      </div>
    </section>
  );
}

// A small mock of the workspace, redrawn from the answers so far.
function Preview({ values, domain, slug }: { values: OnboardingValues; domain: string; slug: string }) {
  const reduce = useReducedMotion();
  const on = SETTINGS.filter((setting) => values.settings[setting.id]);

  return (
    <aside className="flex flex-col gap-4 rounded-b-3xl border-t border-border bg-muted/40 p-6 sm:p-8 lg:rounded-bl-none lg:rounded-r-3xl lg:border-l lg:border-t-0">
      <p className="text-xs font-medium text-muted-foreground">Live preview</p>
      <div className="flex flex-col gap-5 rounded-2xl bg-background p-5 shadow-[0_0_0_1px_var(--border),0_16px_40px_-28px_rgb(0_0_0/0.35)]">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={values.icon}
              initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background"
            >
              {ICONS[values.icon]}
            </motion.span>
          </AnimatePresence>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{values.name || "Your workspace"}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {domain}/{slug}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Used for</span>
          <span className="text-xs font-medium text-foreground">{USES[values.use] ?? "Anything"}</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Team</span>
            <span className="text-xs tabular-nums text-muted-foreground">{values.invites.length + 1} people</span>
          </div>
          <AvatarGroup size="sm" max={5}>
            <Avatar size="sm" src={FACES[5]} alt="You" fallback="You" />
            {values.invites.map((email, index) => (
              <Avatar key={email} size="sm" src={FACES[index % 5]} alt={email} fallback={email.slice(0, 2).toUpperCase()} />
            ))}
          </AvatarGroup>
          <ul className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {values.invites.slice(0, 3).map((email) => (
                <motion.li
                  key={email}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-foreground">{email}</span>
                  <span className="shrink-0 capitalize text-muted-foreground">{values.role}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="flex min-h-7 flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {on.map((setting) => (
              <motion.span
                key={setting.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium text-foreground"
              >
                <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                {setting.label}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

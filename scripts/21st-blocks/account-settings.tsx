"use client";

import { Bell, CreditCard, ShieldAlert, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId, useRef, useState } from "react";
import { Avatar } from "@/components/motion/avatar";
import { Badge } from "@/components/motion/badge";
import { Button } from "@/components/motion/button";
import { HoldToConfirm } from "@/components/motion/hold-to-confirm";
import { Input } from "@/components/motion/input";
import { Progress } from "@/components/motion/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Switch } from "@/components/motion/switch";
import { Textarea } from "@/components/motion/textarea";
import { Toaster, toast } from "@/components/motion/toast";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface AccountValues {
  name: string;
  email: string;
  timezone: string;
  bio: string;
  notify: Record<string, boolean>;
}

export interface AccountSettingsProps {
  /** Profile photo. */
  avatar?: string;
  defaultValues?: Partial<AccountValues>;
  /** Called with every field when Save is pressed. */
  onSave?: (values: AccountValues) => void;
  /** Called once the delete hold completes. */
  onDelete?: () => void;
  className?: string;
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "plan", label: "Plan and usage", icon: <CreditCard className="h-4 w-4" /> },
  { id: "danger", label: "Danger zone", icon: <ShieldAlert className="h-4 w-4" /> },
];

const NOTIFY = [
  { id: "mentions", label: "Mentions and replies", description: "When someone tags you in a comment." },
  { id: "product", label: "Product updates", description: "New features, about once a month." },
  { id: "digest", label: "Weekly digest", description: "A Monday summary of your projects." },
  { id: "security", label: "Security alerts", description: "New sign ins and password changes. Always on.", locked: true },
];

const USAGE = [
  { label: "Seats", used: 8, total: 10, unit: "" },
  { label: "Storage", used: 42, total: 100, unit: " GB" },
  { label: "AI credits", used: 7300, total: 10000, unit: "" },
];

const DEFAULTS: AccountValues = {
  name: "Maya Chen",
  email: "maya@lumen.io",
  timezone: "pst",
  bio: "Design engineer. I make interfaces that feel quick and calm.",
  notify: { mentions: true, product: false, digest: true, security: true },
};

function Section({ id, title, description, children, tone }: { id: string; title: string; description: string; children: ReactNode; tone?: "danger" }) {
  return (
    <section
      id={id}
      className={cn(
        "flex scroll-mt-4 flex-col gap-5 rounded-2xl bg-background p-5 sm:p-6",
        tone === "danger" ? "shadow-[0_0_0_1px_color-mix(in_oklch,var(--destructive)_35%,transparent)]" : "shadow-[0_0_0_1px_var(--border)]",
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className={cn("text-base font-semibold", tone === "danger" ? "text-destructive" : "text-foreground")}>{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** An account settings page. Edits raise a save bar from the bottom, and the account deletes on a held press. */
export function AccountSettings({
  avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  defaultValues,
  onSave,
  onDelete,
  className,
}: AccountSettingsProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const start = { ...DEFAULTS, ...defaultValues };
  const [saved, setSaved] = useState<AccountValues>(start);
  const [values, setValues] = useState<AccountValues>(start);
  const [active, setActive] = useState(SECTIONS[0].id);
  const scroller = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const set = <K extends keyof AccountValues>(key: K, value: AccountValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const jump = (section: string) => {
    setActive(section);
    const node = scroller.current?.querySelector<HTMLElement>(`#${section}`);
    node?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // Marks the section nearest the top of the scroll area as the current one.
  const onScroll = () => {
    const root = scroller.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top;
    const current = SECTIONS.filter((section) => {
      const node = root.querySelector<HTMLElement>(`#${section.id}`);
      return node ? node.getBoundingClientRect().top - top < 120 : false;
    }).pop();
    if (current) setActive(current.id);
  };

  const save = () => {
    setSaved(values);
    onSave?.(values);
    toast.success("Settings saved", { description: "Your changes are live." });
  };

  const discard = () => setValues(saved);

  return (
    <section className={cn("w-full px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-muted/40 shadow-[0_0_0_1px_var(--border),0_24px_60px_-32px_rgb(0_0_0/0.35)] lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto border-b border-border p-3 lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
          <div className="hidden px-3 pb-3 pt-1 lg:block">
            <p className="text-base font-semibold text-foreground">Settings</p>
            <p className="text-xs text-muted-foreground">Manage your account</p>
          </div>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => jump(section.id)}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40",
                active === section.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active === section.id ? (
                <motion.span
                  layoutId={`${id}-nav`}
                  transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.3 }}
                  className="absolute inset-0 rounded-xl bg-background shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.06)]"
                />
              ) : null}
              <span className="relative flex items-center gap-2.5">
                {section.icon}
                {section.label}
              </span>
            </button>
          ))}
        </nav>

        <div ref={scroller} onScroll={onScroll} className="relative flex h-[640px] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <Section id="profile" title="Profile" description="How you show up to your team.">
            <div className="flex items-center gap-4">
              <Avatar size="lg" src={avatar} alt={values.name} fallback={values.name.slice(0, 1)} status="online" />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  Change photo
                </Button>
                <Button variant="ghost" size="sm">
                  Remove
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-name`} className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input id={`${id}-name`} value={values.name} onChange={(event) => set("name", event.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-email`} className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input id={`${id}-email`} type="email" value={values.email} onChange={(event) => set("email", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Time zone</span>
              <Select value={values.timezone} onValueChange={(value) => set("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pst">Pacific Time, Los Angeles</SelectItem>
                  <SelectItem value="est">Eastern Time, New York</SelectItem>
                  <SelectItem value="gmt">Greenwich Mean Time, London</SelectItem>
                  <SelectItem value="cet">Central European Time, Berlin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-bio`} className="text-sm font-medium text-foreground">
                Bio
              </label>
              <Textarea id={`${id}-bio`} rows={2} value={values.bio} onChange={(event) => set("bio", event.target.value)} />
            </div>
          </Section>

          <Section id="notifications" title="Notifications" description="Pick what is worth an email.">
            <div className="flex flex-col divide-y divide-border">
              {NOTIFY.map((item) => (
                <label
                  key={item.id}
                  htmlFor={`${id}-${item.id}`}
                  className={cn("flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0", item.locked ? "cursor-not-allowed" : "cursor-pointer")}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <Switch
                    id={`${id}-${item.id}`}
                    disabled={item.locked}
                    checked={values.notify[item.id] ?? false}
                    onCheckedChange={(on) => set("notify", { ...values.notify, [item.id]: on })}
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section id="plan" title="Plan and usage" description="Resets on the first of each month.">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Pro</span>
                <Badge variant="accent">Annual</Badge>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">$190 a year</span>
            </div>
            <div className="flex flex-col gap-4">
              {USAGE.map((meter) => (
                <div key={meter.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{meter.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {meter.used.toLocaleString("en-US")}
                      {meter.unit} of {meter.total.toLocaleString("en-US")}
                      {meter.unit}
                    </span>
                  </div>
                  <Progress value={(meter.used / meter.total) * 100} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                Manage plan
              </Button>
              <Button variant="ghost" size="sm">
                Billing history
              </Button>
            </div>
          </Section>

          <Section id="danger" title="Danger zone" description="Deleting your account removes your projects and files for good." tone="danger">
            <div className="flex flex-col gap-4 rounded-xl bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Delete account</span>
                <span className="text-xs text-muted-foreground">12 projects and 3.2 GB of files go with it.</span>
              </div>
              <HoldToConfirm
                confirmedLabel="Deleted"
                onConfirm={() => {
                  onDelete?.();
                  toast("Account scheduled for deletion", {
                    description: "You have 30 days to change your mind.",
                    action: { label: "Undo", onClick: () => toast.success("Account restored") },
                  });
                }}
              >
                Hold to delete
              </HoldToConfirm>
            </div>
          </Section>

          {/* Rides the bottom of the scroll area while there is something to save. */}
          <AnimatePresence>
            {dirty ? (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="sticky bottom-0 z-10 mt-auto flex items-center justify-between gap-3 rounded-2xl bg-foreground py-2.5 pl-4 pr-2.5 text-background shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45)]"
                role="status"
              >
                <span className="text-sm font-medium">You have unsaved changes</span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={discard}
                    className="h-8 rounded-full px-3 text-sm font-medium text-background/70 outline-none transition-colors duration-150 hover:text-background focus-visible:ring-2 focus-visible:ring-background/50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    className="h-8 rounded-full bg-background px-3.5 text-sm font-medium text-foreground outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-background/50"
                  >
                    Save changes
                  </button>
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <Toaster />
    </section>
  );
}

"use client";

import { ArrowDownLeft, ArrowUpRight, BatteryFull, Bell, Check, Home, Search, Signal, User, Wallet, Wifi } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/motion/avatar";
import { Badge } from "@/components/motion/badge";
import { Button } from "@/components/motion/button";
import { DynamicIsland, DynamicIslandView } from "@/components/motion/dynamic-island";
import { type ExpandableTab, ExpandableTabs } from "@/components/motion/expandable-tabs";
import { NumberTicker } from "@/components/motion/number-ticker";
import { PullToRefresh } from "@/components/motion/pull-to-refresh";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface MobileAppProps {
  title?: string;
  description?: string;
  /** Plays a payment on the Dynamic Island every few seconds. Default true. */
  live?: boolean;
  className?: string;
}

interface Activity {
  id: string;
  name: string;
  note: string;
  amount: number;
  avatar: string;
  when: string;
}

const FACE = (id: string) => `https://images.unsplash.com/${id}?w=96&h=96&fit=crop`;

const ACTIVITY: Activity[] = [
  { id: "a1", name: "Leo Park", note: "Dinner split", amount: 42, avatar: FACE("photo-1507003211169-0a1dd7228f2d"), when: "2m" },
  { id: "a2", name: "Ava Moreno", note: "Concert tickets", amount: -86, avatar: FACE("photo-1438761681033-6461ffad8d80"), when: "1h" },
  { id: "a3", name: "Noah Smith", note: "Coffee", amount: 6, avatar: FACE("photo-1500648767791-00dcc994a43e"), when: "3h" },
  { id: "a4", name: "Zoe Adams", note: "Rent share", amount: -640, avatar: FACE("photo-1534528741775-53994a69daeb"), when: "Mon" },
  { id: "a5", name: "Sam Rivera", note: "Bike repair", amount: 35, avatar: FACE("photo-1506794778202-cad84cf45f1d"), when: "Sun" },
];

const INCOMING: Activity[] = [
  { id: "in1", name: "Ivy Laurent", note: "Weekend trip", amount: 120, avatar: FACE("photo-1544005313-94ddf0286df2"), when: "Now" },
  { id: "in2", name: "Owen Brooks", note: "Lunch", amount: 18, avatar: FACE("photo-1472099645785-5658abf4ff4e"), when: "Now" },
];

const TABS: ExpandableTab[] = [
  { id: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
  { id: "search", label: "Search", icon: <Search className="h-4 w-4" /> },
  { id: "alerts", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
  { id: "me", label: "Me", icon: <User className="h-4 w-4" /> },
];

const FEATURES = [
  { icon: <Wallet className="h-4 w-4" />, title: "Split anything", text: "Dinner, rent or a trip, settled in a tap." },
  { icon: <Bell className="h-4 w-4" />, title: "Live on your lock screen", text: "Payments show up the second they land." },
  { icon: <Check className="h-4 w-4" />, title: "Always in sync", text: "Pull down anywhere to refresh." },
];

const usd = (n: number) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US")}`;

function Row({ item, fresh }: { item: Activity; fresh?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={!reduce}
      initial={fresh && !reduce ? { opacity: 0, y: -12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="flex items-center gap-3 py-2.5"
    >
      <Avatar size="sm" src={item.avatar} alt="" fallback={item.name.slice(0, 1)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
        <span className="truncate text-xs text-muted-foreground">{item.note}</span>
      </span>
      <span className="flex flex-col items-end">
        <span className={cn("text-sm font-semibold tabular-nums", item.amount > 0 ? "text-success" : "text-foreground")}>{usd(item.amount)}</span>
        <span className="text-[11px] text-muted-foreground">{item.when}</span>
      </span>
    </motion.li>
  );
}

function Screen({ tab, items, balance, freshId }: { tab: string; items: Activity[]; balance: number; freshId: string | null }) {
  if (tab === "home") {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            <NumberTicker value={balance} format={(n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <span className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-foreground text-sm font-medium text-background">
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            Send
          </span>
          <span className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-muted text-sm font-medium text-foreground">
            <ArrowDownLeft aria-hidden="true" className="h-4 w-4" />
            Request
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-foreground">Activity</span>
          <span className="text-xs text-muted-foreground">Pull to refresh</span>
        </div>
        <ul className="-mt-2 flex flex-col divide-y divide-border">
          {items.map((item) => (
            <Row key={item.id} item={item} fresh={item.id === freshId} />
          ))}
        </ul>
      </div>
    );
  }
  if (tab === "alerts") {
    return (
      <div className="flex flex-col gap-3 px-4 pb-24 pt-2">
        <span className="text-xl font-semibold text-foreground">Alerts</span>
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
            <Avatar size="sm" src={item.avatar} alt="" fallback={item.name.slice(0, 1)} />
            <span className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span className="text-foreground">
                <span className="font-medium">{item.name}</span> {item.amount > 0 ? "paid you" : "requested"} {usd(item.amount).slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">{item.note}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "me") {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-24 pt-6 text-center">
        <Avatar size="lg" src={FACE("photo-1494790108377-be9c29b29330")} alt="" fallback="M" status="online" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">Maya Chen</span>
          <span className="text-xs text-muted-foreground">@maya, joined 2024</span>
        </div>
        <div className="mt-2 grid w-full grid-cols-3 gap-2">
          {[
            ["128", "Payments"],
            ["24", "Friends"],
            ["6", "Groups"],
          ].map(([value, label]) => (
            <span key={label} className="flex flex-col rounded-xl bg-muted/60 py-3">
              <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-4 pb-24 pt-2">
      <span className="text-xl font-semibold text-foreground">Search</span>
      <div className="flex h-10 items-center gap-2 rounded-xl bg-muted px-3 text-sm text-muted-foreground">
        <Search aria-hidden="true" className="h-4 w-4" />
        People, groups, notes
      </div>
      <span className="pt-2 text-xs font-medium text-muted-foreground">Recent</span>
      <div className="grid grid-cols-4 gap-3">
        {items.slice(0, 4).map((item) => (
          <span key={item.id} className="flex flex-col items-center gap-1.5">
            <Avatar size="md" src={item.avatar} alt="" fallback={item.name.slice(0, 1)} />
            <span className="w-full truncate text-center text-[11px] text-foreground">{item.name.split(" ")[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Phone({ live }: { live: boolean }) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState("home");
  const [items, setItems] = useState(ACTIVITY);
  const [balance, setBalance] = useState(2481.5);
  const [island, setIsland] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Activity>(INCOMING[0]);
  const [freshId, setFreshId] = useState<string | null>(null);

  const land = useCallback((payment: Activity) => {
    const entry = { ...payment, id: `${payment.id}-${Date.now()}` };
    setIncoming(payment);
    setIsland("payment");
    setItems((list) => [entry, ...list].slice(0, 6));
    setFreshId(entry.id);
    setBalance((b) => b + payment.amount);
  }, []);

  // A payment lands every few seconds: the island opens with it, then folds back to a pill.
  useEffect(() => {
    if (!live) return;
    let count = 0;
    const timers: number[] = [];
    const play = () => {
      land(INCOMING[count % INCOMING.length]);
      count += 1;
      timers.push(window.setTimeout(() => setIsland(null), 3200));
    };
    timers.push(window.setTimeout(play, 1600));
    const loop = window.setInterval(play, 9000);
    return () => {
      window.clearInterval(loop);
      for (const id of timers) window.clearTimeout(id);
    };
  }, [live, land]);

  const refresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, reduce ? 0 : 900));
    setIsland("synced");
    window.setTimeout(() => setIsland(null), 1800);
  };

  return (
    <div className="relative mx-auto w-[320px] shrink-0 rounded-[52px] bg-foreground p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.5)]">
      <div className="relative h-[640px] overflow-hidden rounded-[44px] bg-background">
        <div className="flex h-12 items-center justify-between px-7 pt-1 text-xs font-semibold text-foreground">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <Signal aria-hidden="true" className="h-3.5 w-3.5" />
            <Wifi aria-hidden="true" className="h-3.5 w-3.5" />
            <BatteryFull aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>

        <div className="absolute inset-x-0 top-2.5 z-20 flex justify-center px-3">
          <DynamicIsland view={island} compact={<span className="block h-4 w-16" />}>
            <DynamicIslandView id="payment">
              <Avatar size="sm" src={incoming.avatar} alt="" fallback={incoming.name.slice(0, 1)} />
              <span className="flex min-w-0 flex-col pr-2">
                <span className="truncate text-sm font-medium">{incoming.name} paid you</span>
                <span className="truncate text-xs opacity-70">{incoming.note}</span>
              </span>
              <span className="text-base font-semibold tabular-nums">{usd(incoming.amount)}</span>
            </DynamicIslandView>
            <DynamicIslandView id="synced">
              <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
              <span className="pr-1 text-sm font-medium">Up to date</span>
            </DynamicIslandView>
          </DynamicIsland>
        </div>

        <PullToRefresh onRefresh={refresh} className="h-[592px]">
          <div className="min-h-[600px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
              >
                <Screen tab={tab} items={items} balance={balance} freshId={freshId} />
              </motion.div>
            </AnimatePresence>
          </div>
        </PullToRefresh>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-background via-background/90 to-transparent pb-2 pt-8">
          <div className="pointer-events-auto">
            <ExpandableTabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <span aria-hidden="true" className="h-1 w-28 rounded-full bg-foreground/80" />
        </div>
      </div>
    </div>
  );
}

/** An app launch section: the pitch on one side and a live phone on the other, with a reacting Dynamic Island. */
export function MobileApp({
  title = "Money between friends, settled in a tap",
  description = "Split a bill, send it back, and watch it land on your lock screen. Try the phone, pull the feed or switch tabs.",
  live = true,
  className,
}: MobileAppProps) {
  return (
    <section className={cn("w-full px-4 py-16 sm:px-6", className)}>
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="w-fit">
              <Badge variant="accent">New in 2.0</Badge>
            </span>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h2>
            <p className="max-w-md text-pretty text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground shadow-[0_0_0_1px_var(--border)]">
                  {feature.icon}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{feature.title}</span>
                  <span className="text-sm text-muted-foreground">{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Get the app</Button>
            <Button size="lg" variant="outline">
              See how it works
            </Button>
          </div>
        </div>
        <Phone live={live} />
      </div>
    </section>
  );
}

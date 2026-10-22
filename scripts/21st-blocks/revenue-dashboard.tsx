"use client";

import { CreditCard, DollarSign, Percent, ShoppingBag } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Avatar } from "@/components/motion/avatar";
import { Badge, type BadgeVariant } from "@/components/motion/badge";
import { InsightCard } from "@/components/motion/insight-card";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/motion/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface RevenueRange {
  label: string;
  revenue: number;
  orders: number;
  conversion: number;
  /** Twelve points, oldest first, drawn as the chart. */
  series: number[];
  /** Labels under the chart, spread evenly. */
  ticks: string[];
  trend: number;
}

export interface Payment {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  /** When it landed, in ms since the epoch. */
  at: number;
}

export interface RevenueDashboardProps {
  title?: string;
  ranges?: Record<string, RevenueRange>;
  /** Starting rows of the payments table, newest first. */
  payments?: Omit<Payment, "at" | "id">[];
  /** Adds a new payment every few seconds so the numbers roll. Default true. */
  live?: boolean;
  className?: string;
}

const RANGES: Record<string, RevenueRange> = {
  today: {
    label: "Today",
    revenue: 4820,
    orders: 63,
    conversion: 3.4,
    trend: 12.4,
    series: [120, 180, 150, 260, 310, 280, 420, 390, 510, 470, 600, 640],
    ticks: ["8am", "11am", "2pm", "5pm", "8pm"],
  },
  week: {
    label: "7 days",
    revenue: 31240,
    orders: 412,
    conversion: 3.1,
    trend: 8.2,
    series: [3200, 2900, 4100, 3800, 4600, 4200, 5100, 4700, 5600, 5300, 6100, 5900],
    ticks: ["Mon", "Wed", "Fri", "Sun"],
  },
  month: {
    label: "30 days",
    revenue: 128900,
    orders: 1688,
    conversion: 2.8,
    trend: 21.7,
    series: [2800, 3400, 3100, 3900, 4400, 4100, 4900, 5600, 5200, 6300, 6900, 7400],
    ticks: ["Sep 1", "Sep 10", "Sep 20", "Sep 30"],
  },
};

const FACE = (id: string) => `https://images.unsplash.com/${id}?w=96&h=96&fit=crop`;

const PAYMENTS: Omit<Payment, "at" | "id">[] = [
  { name: "Maya Chen", email: "maya@lumen.io", avatar: FACE("photo-1494790108377-be9c29b29330"), plan: "Team", amount: 240, status: "paid" },
  { name: "Leo Park", email: "leo@orbit.dev", avatar: FACE("photo-1507003211169-0a1dd7228f2d"), plan: "Pro", amount: 49, status: "paid" },
  { name: "Ava Moreno", email: "ava@hatch.co", avatar: FACE("photo-1438761681033-6461ffad8d80"), plan: "Lifetime", amount: 299, status: "pending" },
  { name: "Noah Smith", email: "noah@field.app", avatar: FACE("photo-1500648767791-00dcc994a43e"), plan: "Pro", amount: 49, status: "refunded" },
  { name: "Zoe Adams", email: "zoe@kite.so", avatar: FACE("photo-1534528741775-53994a69daeb"), plan: "Team", amount: 240, status: "paid" },
];

// New sales cycle through these.
const INCOMING: Omit<Payment, "at" | "id" | "status">[] = [
  { name: "Sam Rivera", email: "sam@north.dev", avatar: FACE("photo-1506794778202-cad84cf45f1d"), plan: "Pro", amount: 49 },
  { name: "Ivy Laurent", email: "ivy@atlas.design", avatar: FACE("photo-1544005313-94ddf0286df2"), plan: "Lifetime", amount: 299 },
  { name: "Owen Brooks", email: "owen@mesa.io", avatar: FACE("photo-1472099645785-5658abf4ff4e"), plan: "Team", amount: 240 },
];

const STATUS: Record<Payment["status"], { label: string; variant: BadgeVariant }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  refunded: { label: "Refunded", variant: "neutral" },
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function ago(at: number, now: number) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

const W = 640;
const H = 200;

// Points scaled into the chart box, with headroom above the highest value.
function toPoints(series: number[]) {
  const max = Math.max(...series) * 1.15;
  return series.map((value, index) => [(index / (series.length - 1)) * W, H - (value / max) * H] as const);
}

// A smooth line through the points, built from cubic curves with horizontal handles.
function linePath(points: readonly (readonly [number, number])[]) {
  return points.reduce((path, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    const [px, py] = points[index - 1];
    const mid = (px + x) / 2;
    return `${path} C ${mid} ${py} ${mid} ${y} ${x} ${y}`;
  }, "");
}

function Chart({ series, ticks }: { series: number[]; ticks: string[] }) {
  const id = useId();
  const reduce = useReducedMotion();
  const points = toPoints(series);
  const line = linePath(points);
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const transition = { duration: reduce ? 0 : 0.6, ease: EASE_IN_OUT };

  return (
    // The chart keeps its width and scrolls inside the card on a phone.
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="min-w-[520px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full overflow-visible text-accent" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((row) => (
            <line key={row} x1="0" x2={W} y1={H * row} y2={H * row} className="stroke-border" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          ))}
          <motion.path initial={false} animate={{ d: area }} transition={transition} fill={`url(#${id}-fill)`} />
          <motion.path
            initial={false}
            animate={{ d: line }}
            transition={transition}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <motion.circle initial={false} animate={{ cx: lastX, cy: lastY }} transition={transition} r="5" fill="currentColor" className="animate-pulse motion-reduce:animate-none" />
        </svg>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A live revenue overview: rolling totals, a range switcher, an area chart and the latest payments. */
export function RevenueDashboard({ title = "Revenue", ranges = RANGES, payments = PAYMENTS, live = true, className }: RevenueDashboardProps) {
  const keys = Object.keys(ranges);
  const [range, setRange] = useState(keys[0]);
  const [now, setNow] = useState(() => Date.now());
  const [rows, setRows] = useState<Payment[]>(() =>
    payments.map((payment, index) => ({ ...payment, id: `seed-${index}`, at: Date.now() - (index * 4 + 2) * 60_000 })),
  );
  const [extra, setExtra] = useState({ revenue: 0, orders: 0, last: 0 });
  const [fresh, setFresh] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const current = ranges[range] ?? ranges[keys[0]];

  // A sale lands every few seconds: it tops the table and rolls the totals.
  useEffect(() => {
    if (!live) return;
    let count = 0;
    const id = window.setInterval(() => {
      const next = INCOMING[count % INCOMING.length];
      const payment: Payment = { ...next, id: `live-${count}`, status: "paid", at: Date.now() };
      count += 1;
      setNow(Date.now());
      setRows((list) => [payment, ...list].slice(0, 5));
      setExtra((e) => ({ revenue: e.revenue + payment.amount, orders: e.orders + 1, last: payment.amount }));
      setFresh(payment.id);
    }, 3600);
    return () => window.clearInterval(id);
  }, [live]);

  // The newest row glows for a moment, then settles.
  useEffect(() => {
    if (!fresh) return;
    const id = window.setTimeout(() => setFresh(null), 1600);
    return () => window.clearTimeout(id);
  }, [fresh]);

  const revenue = current.revenue + extra.revenue;
  const orders = current.orders + extra.orders;
  // The last point of the chart grows with each live sale too.
  const series = current.series.map((value, index) => (index === current.series.length - 1 ? value + extra.revenue / 4 : value));

  return (
    <section className={cn("w-full px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-3xl bg-background p-5 shadow-[0_0_0_1px_var(--border),0_24px_60px_-32px_rgb(0_0_0/0.35)] sm:p-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
              {live ? (
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                  Live
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {extra.last ? `Latest sale ${money(extra.last)}, ${ago(rows[0].at, now).toLowerCase()}` : "Every sale, the moment it lands."}
            </p>
          </div>
          <Tabs value={range} onValueChange={setRange} variant="segment">
            <TabsList>
              {keys.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {ranges[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InsightCard
            label="Revenue"
            icon={<DollarSign className="h-4 w-4" />}
            value={<NumberTicker value={revenue} format={money} />}
            trend={{ value: current.trend, direction: "up" }}
          />
          <InsightCard label="Orders" icon={<ShoppingBag className="h-4 w-4" />} value={<NumberTicker value={orders} />} trend={{ value: 6.1, direction: "up" }} />
          <InsightCard
            label="Conversion"
            icon={<Percent className="h-4 w-4" />}
            value={<NumberTicker value={current.conversion * 10} format={(n) => `${(n / 10).toFixed(1)}%`} />}
            trend={{ value: 0.4, direction: range === "month" ? "down" : "up" }}
          />
        </div>

        <div className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--border)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Sales over time</p>
            <p className="text-xs text-muted-foreground">{current.label}</p>
          </div>
          <Chart series={series} ticks={current.ticks} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Latest payments</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard aria-hidden="true" className="h-3.5 w-3.5" />
              {orders.toLocaleString("en-US")} this period
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="block text-right">Amount</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} selected={row.id === fresh}>
                  <TableCell emphasis>
                    <motion.div
                      initial={reduce || row.id.startsWith("seed") ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="flex min-w-48 items-center gap-3"
                    >
                      <Avatar size="sm" src={row.avatar} alt="" fallback={row.name.slice(0, 1)} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{row.name}</span>
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {row.email}, {ago(row.at, now).toLowerCase()}
                        </span>
                      </span>
                    </motion.div>
                  </TableCell>
                  <TableCell>{row.plan}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS[row.status].variant}>{STATUS[row.status].label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="block text-right tabular-nums">{money(row.amount)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

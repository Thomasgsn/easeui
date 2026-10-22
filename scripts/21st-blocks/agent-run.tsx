"use client";

import { FileCode2, FileDiff, Search, Sparkles, Terminal } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Badge, type BadgeVariant } from "@/components/motion/badge";
import { MessageBubble } from "@/components/motion/message-bubble";
import { PromptInput } from "@/components/motion/prompt-input";
import { StreamingResponse } from "@/components/motion/streaming-response";
import { StreamingText } from "@/components/motion/streaming-text";
import { type TodoItem, TodoList } from "@/components/motion/todo-list";
import { ToolApproval, type ToolApprovalStatus } from "@/components/motion/tool-approval";
import { ToolChip } from "@/components/motion/tool-chip";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface AgentRunTool {
  icon: ReactNode;
  label: string;
  /** A file this step touched, listed under Context once it finishes. */
  file?: string;
}

export interface AgentRunProps {
  /** Name in the panel header. */
  title?: string;
  /** The first request, played on mount. */
  prompt?: string;
  /** Steps of the plan. The last one finishes with the answer. */
  plan?: string[];
  /** Tools that run before the approval step, one after another. */
  tools?: AgentRunTool[];
  /** The command the agent asks to run. */
  approval?: { title: string; command: string };
  /** Streamed once the command is approved. */
  answer?: string;
  /** The agent's first line, before its tools run. */
  intro?: string;
  /** Streamed when the command is denied. */
  deniedAnswer?: string;
  followUps?: string[];
  className?: string;
}

type Phase = "working" | "approval" | "streaming" | "done";

const STATUS: Record<Phase, { label: string; variant: BadgeVariant }> = {
  working: { label: "Working", variant: "accent" },
  approval: { label: "Needs approval", variant: "warning" },
  streaming: { label: "Writing", variant: "accent" },
  done: { label: "Done", variant: "success" },
};

const STEP_MS = 800;

const DEFAULT_TOOLS: AgentRunTool[] = [
  { icon: <Search className="h-3.5 w-3.5" />, label: "Searched the repo" },
  { icon: <FileCode2 className="h-3.5 w-3.5" />, label: "Read checkout.test.ts", file: "src/checkout/checkout.test.ts" },
  { icon: <FileDiff className="h-3.5 w-3.5" />, label: "Patched price.ts", file: "src/lib/price.ts" },
];

/** An agent working through a request: a plan that ticks off, tool calls, an approval gate and a streamed answer. */
export function AgentRun({
  title = "Release agent",
  prompt = "The checkout test is failing on main. Find out why and fix it.",
  plan = ["Find the failing test", "Read the checkout flow", "Patch the rounding bug", "Run the suite again"],
  tools = DEFAULT_TOOLS,
  approval = { title: "Run the checkout tests with the fix", command: "pnpm vitest run src/checkout" },
  answer = "Found it. Prices were rounded before the discount was applied, so a 15% code on $19.99 came out a cent short and the snapshot failed. I moved the rounding to the end in price.ts, and all 48 checkout tests pass now.",
  intro = "On it. I will trace the failure, patch it and run the suite again.",
  deniedAnswer = "No problem, nothing ran. The fix is ready in price.ts, where rounding now happens after the discount. Run the checkout tests whenever you are ready.",
  followUps = ["Open a pull request with this fix", "Add a test for stacked discounts"],
  className,
}: AgentRunProps) {
  const reduce = useReducedMotion();
  const [request, setRequest] = useState(prompt);
  const [phase, setPhase] = useState<Phase>("working");
  const [toolsDone, setToolsDone] = useState(0);
  const [decision, setDecision] = useState<ToolApprovalStatus>("pending");
  const [shown, setShown] = useState(0);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const reply = decision === "denied" ? deniedAnswer : answer;

  const clear = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  // Each tool finishes one step after the last, then the run stops at the approval card.
  const start = useCallback(
    (text: string) => {
      clear();
      setRequest(text);
      setDecision("pending");
      setShown(0);
      setPhase("working");
      setToolsDone(reduce ? tools.length : 0);
      if (reduce) {
        setPhase("approval");
        return;
      }
      tools.forEach((_, index) => {
        timers.current.push(window.setTimeout(() => setToolsDone(index + 1), STEP_MS * (index + 1)));
      });
      timers.current.push(window.setTimeout(() => setPhase("approval"), STEP_MS * tools.length + 300));
    },
    [clear, reduce, tools],
  );

  useEffect(() => {
    start(prompt);
    return clear;
  }, [prompt, start, clear]);

  // Streams the reply a few characters at a time once the approval is settled.
  useEffect(() => {
    if (phase !== "streaming") return;
    if (reduce || shown >= reply.length) {
      setShown(reply.length);
      setPhase("done");
      return;
    }
    const id = window.setTimeout(() => setShown((n) => Math.min(reply.length, n + 3)), 22);
    return () => window.clearTimeout(id);
  }, [phase, shown, reply, reduce]);

  // Keeps the newest part of the thread in view.
  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  });

  const decide = (next: ToolApprovalStatus) => {
    setDecision(next);
    setPhase("streaming");
  };

  // The plan follows the run: one step per tool pair, then the approval, then the answer.
  const progress = phase === "done" ? plan.length : phase === "streaming" ? plan.length - 1 : phase === "approval" ? plan.length - 2 : Math.min(plan.length - 2, Math.floor((toolsDone * (plan.length - 2)) / tools.length));
  const items: TodoItem[] = plan.map((label, index) => ({
    id: label,
    label,
    status: index < progress ? "done" : index === progress ? "active" : "pending",
  }));
  const files = tools.slice(0, toolsDone).flatMap((tool) => (tool.file ? [tool.file] : []));
  const busy = phase === "working" || phase === "streaming";

  return (
    <section className={cn("w-full px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-background shadow-[0_0_0_1px_var(--border),0_24px_60px_-32px_rgb(0_0_0/0.35)]">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{tools.length} tools, asks before running commands</p>
            </div>
          </div>
          <span className="shrink-0">
            <Badge variant={STATUS[phase].variant} aria-live="polite">
              {busy ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" /> : null}
              {STATUS[phase].label}
            </Badge>
          </span>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col">
            <div ref={scroller} className="flex h-[420px] flex-col gap-5 overflow-y-auto px-5 py-6">
              <MessageBubble key={request} align="end" tone="accent">
                {request}
              </MessageBubble>

              <div className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground shadow-[0_0_0_1px_var(--border)]">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <p className="pt-1 text-sm leading-6 text-foreground">{intro}</p>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                      {tools.slice(0, Math.min(tools.length, toolsDone + 1)).map((tool, index) => (
                        <motion.span
                          key={`${request}-${tool.label}`}
                          initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2, ease: EASE_OUT }}
                        >
                          <ToolChip icon={tool.icon} label={tool.label} status={index < toolsDone ? "done" : "running"} />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>

                  {phase !== "working" ? (
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                    >
                      <ToolApproval
                        title={approval.title}
                        description={approval.command}
                        status={decision}
                        approveLabel="Run it"
                        onApprove={() => decide("approved")}
                        onDeny={() => decide("denied")}
                      />
                    </motion.div>
                  ) : null}

                  {phase === "streaming" || phase === "done" ? (
                    <StreamingResponse
                      status={phase === "done" ? "complete" : "streaming"}
                      copyText={reply}
                      onRetry={() => start(request)}
                      showFeedback
                      followUps={followUps}
                      onFollowUp={(text) => start(text)}
                    >
                      <StreamingText text={reply.slice(0, shown)} streaming={phase === "streaming"} />
                    </StreamingResponse>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4">
              <PromptInput
                placeholder="Ask the agent to do something"
                loading={busy}
                onStop={() => {
                  clear();
                  setShown(reply.length);
                  setPhase(phase === "working" ? "approval" : "done");
                }}
                onSubmit={start}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-5 border-t border-border bg-muted/40 p-4 lg:border-l lg:border-t-0">
            <TodoList title="Plan" items={items} />
            <div className="flex flex-col gap-2.5 px-1">
              <p className="text-xs font-medium text-muted-foreground">Context</p>
              {files.length === 0 ? <p className="text-sm text-muted-foreground">Files show up here as the agent reads them.</p> : null}
              <ul className="flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {files.map((file) => (
                    <motion.li
                      key={file}
                      initial={reduce ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-2 text-xs shadow-[0_0_0_1px_var(--border)]"
                    >
                      <FileCode2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-mono text-foreground">{file}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {decision === "approved" && phase === "done" ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Terminal aria-hidden="true" className="h-3.5 w-3.5" />
                  48 tests passed
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

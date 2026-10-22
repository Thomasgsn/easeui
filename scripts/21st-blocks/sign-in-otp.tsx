"use client";

import { ArrowLeft, ArrowRight, Check, Mail, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarGroup } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { Checkbox } from "@/components/motion/checkbox";
import { Input } from "@/components/motion/input";
import { OtpInput } from "@/components/motion/otp-input";
import { Rating } from "@/components/motion/rating";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface SignInOtpProps {
  /** Product name beside the mark. */
  brand?: string;
  defaultEmail?: string;
  /** Checks a code. Resolve true to sign in. By default any code but 000000 works. */
  verify?: (email: string, code: string) => boolean | Promise<boolean>;
  /** Called once the code checks out. */
  onSignedIn?: (email: string) => void;
  /** The quote on the side panel. */
  testimonial?: { quote: string; name: string; role: string; avatar: string };
  className?: string;
}

type Step = "email" | "code" | "done";

const RESEND_SECONDS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TESTIMONIAL = {
  quote: "We moved the whole team over in an afternoon. Signing in is two taps now and nobody has asked me to reset a password since.",
  name: "Leo Park",
  role: "Head of Engineering, Orbit",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop",
};

const TEAM = [
  "photo-1494790108377-be9c29b29330",
  "photo-1500648767791-00dcc994a43e",
  "photo-1438761681033-6461ffad8d80",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1534528741775-53994a69daeb",
].map((photo) => `https://images.unsplash.com/${photo}?w=96&h=96&fit=crop`);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const defaultVerify = async (_email: string, code: string) => {
  await wait(900);
  return code !== "000000";
};

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

/** Two step sign in: an email, then a six digit code that checks itself, beside a customer quote. */
export function SignInOtp({
  brand = "Lumen",
  defaultEmail = "maya@lumen.io",
  verify = defaultVerify,
  onSignedIn,
  testimonial = TESTIMONIAL,
  className,
}: SignInOtpProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bodyRef, bodyHeight] = useHeight<HTMLDivElement>();
  const forward = step !== "email";

  // Counts down to when another code can be sent.
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a full email address, like you@company.com.");
      return;
    }
    setError("");
    setSending(true);
    await wait(reduce ? 0 : 700);
    setSending(false);
    setSeconds(RESEND_SECONDS);
    setStep("code");
  };

  const check = async (code: string) => {
    const ok = await verify(email, code);
    if (ok) {
      window.setTimeout(() => {
        setStep("done");
        onSignedIn?.(email);
      }, 700);
    }
    return ok;
  };

  const offset = reduce ? 0 : forward ? 24 : -24;
  const firstName = email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase());

  return (
    <section className={cn("w-full px-4 py-12 sm:px-6", className)}>
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-background shadow-[0_0_0_1px_var(--border),0_24px_60px_-32px_rgb(0_0_0/0.35)] lg:grid-cols-2">
        <div className="flex min-h-[560px] flex-col p-6 sm:p-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold text-foreground">{brand}</span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-10">
            <motion.div animate={{ height: bodyHeight }} transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }} className="overflow-hidden">
              <div ref={bodyRef}>
                <AnimatePresence mode="wait" initial={false}>
                  {step === "email" ? (
                    <motion.form
                      key="email"
                      onSubmit={sendCode}
                      noValidate
                      initial={{ opacity: 0, x: offset }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: reduce ? 0 : -24 }}
                      transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}
                      className="flex flex-col gap-6 p-1"
                    >
                      <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">No password needed. We will email you a six digit code.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor={`${id}-email`} className="text-sm font-medium text-foreground">
                          Work email
                        </label>
                        <Input
                          id={`${id}-email`}
                          type="email"
                          autoComplete="email"
                          value={email}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${id}-error` : undefined}
                          onChange={(event) => {
                            setError("");
                            setEmail(event.target.value);
                          }}
                          placeholder="you@company.com"
                        />
                        <AnimatePresence initial={false}>
                          {error ? (
                            <motion.p
                              id={`${id}-error`}
                              initial={reduce ? false : { opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={reduce ? undefined : { opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: EASE_OUT }}
                              className="text-xs text-destructive"
                            >
                              {error}
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </div>
                      <label htmlFor={`${id}-remember`} className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                        <Checkbox id={`${id}-remember`} defaultChecked />
                        Keep me signed in on this device
                      </label>
                      <Button type="submit" size="lg" disabled={sending} aria-busy={sending}>
                        {sending ? "Sending code…" : "Email me a code"}
                        {sending ? null : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                      </Button>
                    </motion.form>
                  ) : step === "code" ? (
                    <motion.div
                      key="code"
                      initial={{ opacity: 0, x: offset }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: reduce ? 0 : -24 }}
                      transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}
                      className="flex flex-col gap-6 p-1"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground shadow-[0_0_0_1px_var(--border)]">
                        <Mail aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Check your inbox</h2>
                        <p className="text-sm text-muted-foreground">
                          We sent a code to <span className="font-medium text-foreground">{email}</span>. Any six digits work here except 000000.
                        </p>
                      </div>
                      <div className="flex">
                        <OtpInput onVerify={check} />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <Button variant="ghost" size="sm" onClick={() => setStep("email")}>
                          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                          Use another email
                        </Button>
                        <Button variant="ghost" size="sm" disabled={seconds > 0} onClick={() => sendCode()}>
                          {seconds > 0 ? <span className="tabular-nums">Resend in {seconds}s</span> : "Resend code"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="done"
                      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="flex flex-col items-start gap-6 p-1"
                      role="status"
                    >
                      <div className="relative">
                        <Avatar size="lg" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="" fallback={firstName.slice(0, 1)} />
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-[0_0_0_3px_var(--background)]">
                          <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">You are in, {firstName}</h2>
                        <p className="text-sm text-muted-foreground">Signed in on this device for 30 days.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="lg">
                          Go to dashboard
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="lg" onClick={() => setStep("email")}>
                          Sign out
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground">By continuing you agree to the Terms and Privacy Policy.</p>
        </div>

        <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-muted/50 p-10 lg:flex">
          {/* A faint dot grid, fading toward the quote. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div className="relative flex flex-col gap-5">
            <AvatarGroup size="md" max={5}>
              {TEAM.map((src) => (
                <Avatar key={src} size="md" src={src} alt="" fallback="" />
              ))}
            </AvatarGroup>
            <p className="max-w-sm text-balance text-3xl font-semibold tracking-tight text-foreground">
              4,000 teams sign in without a password.
            </p>
            <div className="flex gap-8">
              {[
                ["2 sec", "average sign in"],
                ["0", "password resets"],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <figure className="relative flex flex-col gap-5 rounded-2xl bg-background p-6 shadow-[0_0_0_1px_var(--border),0_20px_44px_-28px_rgb(0_0_0/0.35)]">
            <Rating value={5} readOnly size="sm" label="Five stars" />
            <blockquote className="text-pretty text-base leading-7 text-foreground">{testimonial.quote}</blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar size="md" src={testimonial.avatar} alt="" fallback={testimonial.name.slice(0, 1)} />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{testimonial.name}</span>
                <span className="text-xs text-muted-foreground">{testimonial.role}</span>
              </span>
            </figcaption>
          </figure>
        </aside>
      </div>
    </section>
  );
}

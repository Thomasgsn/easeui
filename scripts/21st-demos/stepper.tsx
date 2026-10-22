"use client";

import { useState } from "react";
import { Stepper } from "./stepper";

const STEPS = [
  { label: "Account", description: "Email and password" },
  { label: "Workspace", description: "Name and team size" },
  { label: "Invite", description: "Bring your team" },
  { label: "Launch", description: "Start building" },
];

export default function StepperDemo() {
  const [step, setStep] = useState(2);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="mt-1 text-lg font-semibold">Set up your workspace</h3>
        <div className="mt-8">
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </div>
        <div className="mt-8 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-10 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={step === STEPS.length - 1}
            className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

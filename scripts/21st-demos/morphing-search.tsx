"use client";

import { MorphingSearch } from "./morphing-search";

const PROJECTS = [
  { name: "Website redesign", when: "2h ago" },
  { name: "Mobile onboarding", when: "Yesterday" },
  { name: "Pricing page", when: "Mon" },
  { name: "Q4 launch plan", when: "Sep 12" },
];

export default function MorphingSearchDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between gap-4 border-b px-5">
          <span className="text-base font-semibold">Projects</span>
          <MorphingSearch placeholder="Search projects" />
        </div>
        <ul className="divide-y">
          {PROJECTS.map((project) => (
            <li key={project.name} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span>{project.name}</span>
              <span className="text-muted-foreground">{project.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

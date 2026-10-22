"use client";

import { TagInput } from "./tag-input";

export default function TagInputDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Publish your post</h3>
        <p className="mt-1 text-sm text-muted-foreground">Topics help readers find it.</p>
        <p className="mt-5 mb-2 text-sm font-medium">Topics</p>
        <TagInput defaultValue={["react", "design", "motion", "tailwind", "ux"]} max={8} label="Topics" placeholder="Add a topic" />
        <p className="mt-2 text-xs text-muted-foreground">Enter or a comma adds a topic. Backspace twice removes the last one.</p>
        <button
          type="button"
          className="mt-5 h-10 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Publish
        </button>
      </div>
    </div>
  );
}

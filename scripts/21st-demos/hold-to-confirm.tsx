"use client";

import { HoldToConfirm } from "./hold-to-confirm";

export default function HoldToConfirmDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Danger zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting this project removes its files, history and settings for everyone. There is no undo.
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-muted/60 p-4">
          <div>
            <p className="text-sm font-medium">acme-website</p>
            <p className="text-xs text-muted-foreground">12 members, 284 files</p>
          </div>
          <HoldToConfirm onConfirm={() => {}} confirmedLabel="Deleted">
            Hold to delete
          </HoldToConfirm>
        </div>
      </div>
    </div>
  );
}

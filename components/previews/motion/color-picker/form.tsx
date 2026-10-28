"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/motion/color-picker";
import { Button } from "@/components/motion/button";

export function ColorPickerFormPreview() {
  const [saved, setSaved] = useState("");

  return (
    <form className="flex flex-col items-center gap-4" onSubmit={(event) => {
      event.preventDefault();
      setSaved(String(new FormData(event.currentTarget).get("accent")));
    }} onReset={() => setSaved("")}>
      {/* No value prop is needed for an uncontrolled form field. Reset restores defaultValue. */}
      <ColorPicker name="accent" label="Project color" defaultValue="#22c55e"
        swatches={["#22c55e", "#06b6d4", "#6366f1", "#ec4899"]} />
      <div className="flex gap-2">
        <Button type="reset" variant="secondary">Reset</Button>
        <Button type="submit">Save color</Button>
      </div>
      <p role="status" className="min-h-5 text-xs text-muted-foreground">{saved ? `Saved ${saved}` : "Choose a color, then save it."}</p>
    </form>
  );
}

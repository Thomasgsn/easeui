import type { Metadata } from "next";
import { Playground } from "@/components/app/playground/playground";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "A free cubic-bezier editor and motion playground. Shape easing curves, springs and staggers, then copy them as Motion, CSS, Tailwind or GSAP code.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <Playground />;
}

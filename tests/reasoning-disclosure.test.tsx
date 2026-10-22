import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ReasoningDisclosure } from "@/components/motion/reasoning-disclosure";

afterEach(cleanup);

const header = (container: HTMLElement) => container.querySelector("button") as HTMLButtonElement;

test("stays open while thinking, then folds into the time it took", () => {
  const view = render(<ReasoningDisclosure status="thinking">Weighing the options</ReasoningDisclosure>);
  expect(header(view.container).getAttribute("aria-expanded")).toBe("true");
  expect(view.container.textContent).toContain("Thinking");

  view.rerender(
    <ReasoningDisclosure status="done" duration={8}>
      Weighing the options
    </ReasoningDisclosure>,
  );
  expect(header(view.container).getAttribute("aria-expanded")).toBe("false");
  expect(view.container.textContent).toContain("Thought for 8s");
});

test("leaves it open once someone toggled it by hand", () => {
  const view = render(<ReasoningDisclosure status="thinking">Step one</ReasoningDisclosure>);
  fireEvent.click(header(view.container));
  fireEvent.click(header(view.container));

  view.rerender(<ReasoningDisclosure status="done">Step one</ReasoningDisclosure>);
  expect(header(view.container).getAttribute("aria-expanded")).toBe("true");
});

test("a message loaded already done starts folded and can be reopened", () => {
  const view = render(
    <ReasoningDisclosure status="done" duration={75}>
      Old reasoning
    </ReasoningDisclosure>,
  );
  expect(header(view.container).getAttribute("aria-expanded")).toBe("false");
  expect(view.container.textContent).toContain("Thought for 1m 15s");

  fireEvent.click(header(view.container));
  expect(header(view.container).getAttribute("aria-expanded")).toBe("true");
});

test("follows a controlled open prop", () => {
  const view = render(
    <ReasoningDisclosure status="done" open>
      Pinned open
    </ReasoningDisclosure>,
  );
  expect(header(view.container).getAttribute("aria-expanded")).toBe("true");
});

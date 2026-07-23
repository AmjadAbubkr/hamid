// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionReveal, PageEntrance } from "./motion-reveal";

type IntersectionObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0];

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  disconnect() {}

  observe() {}

  unobserve() {}

  reveal() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
  }
}

afterEach(() => {
  MockIntersectionObserver.instances = [];
  vi.unstubAllGlobals();
});

describe("motion foundations", () => {
  it("keeps PageEntrance content visible in server output", () => {
    const html = renderToString(<PageEntrance>Diplomatic profile</PageEntrance>);

    expect(html).toContain("Diplomatic profile");
    expect(html).not.toContain("motion-page-entrance--enabled");
  });

  it("reveals observed content with its configured stagger delay", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));

    render(<MotionReveal delay={120}>Career milestone</MotionReveal>);

    const reveal = screen.getByText("Career milestone");
    expect(reveal).toHaveClass("motion-reveal--enabled");
    expect(reveal).not.toHaveClass("motion-reveal--visible");
    expect(reveal).toHaveStyle({ "--motion-delay": "120ms" });

    act(() => MockIntersectionObserver.instances[0].reveal());

    expect(reveal).toHaveClass("motion-reveal--visible");
  });

  it("leaves MotionReveal visible when reduced motion is preferred", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    render(<MotionReveal>Public statement</MotionReveal>);

    const reveal = screen.getByText("Public statement");
    expect(reveal).not.toHaveClass("motion-reveal--enabled");
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});

// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoCard } from "@/components/demo-card";
import { LOCALE_META } from "@/lib/i18n/locales";
import { STRINGS } from "@/lib/i18n/strings";

const LOGICAL_UTILITIES = ["ps-", "pe-", "ms-", "me-", "text-start", "text-end", "rounded-s-", "rounded-e-"];

describe("DemoCard", () => {
  it("renders the Arabic Locale strings when given locale 'ar'", () => {
    render(<DemoCard locale="ar" />);
    expect(screen.getByText(STRINGS.ar.title)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.ar.body)).toBeInTheDocument();
  });

  it("renders the French Locale strings when given locale 'fr'", () => {
    render(<DemoCard locale="fr" />);
    expect(screen.getByText(STRINGS.fr.title)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.fr.body)).toBeInTheDocument();
  });

  it("exposes the locale direction via a data-dir attribute for both Locales", () => {
    const { rerender, container } = render(<DemoCard locale="ar" />);
    let card = container.querySelector("[data-testid='demo-card']") as HTMLElement;
    expect(card.getAttribute("data-dir")).toBe(LOCALE_META.ar.dir);

    rerender(<DemoCard locale="fr" />);
    card = container.querySelector("[data-testid='demo-card']") as HTMLElement;
    expect(card.getAttribute("data-dir")).toBe(LOCALE_META.fr.dir);
  });

  it("uses only Tailwind logical-property utilities (never physical-direction ones)", () => {
    const { container } = render(<DemoCard locale="ar" />);
    const card = container.querySelector("[data-testid='demo-card']") as HTMLElement;
    const classSources: string[] = [];
    classSources.push(card.className);
    card.querySelectorAll("*").forEach((el) => {
      classSources.push((el as HTMLElement).className || "");
    });
    const classes = classSources.join(" ");

    for (const util of LOGICAL_UTILITIES) {
      const re = new RegExp(`(^|\\s)${util.replace(/[-]/g, "\\-")}`);
      expect(
        re.test(classes),
        `expected card subtree className to contain logical util '${util}'`,
      ).toBe(true);
    }

    const PHYSICAL_BANNED = ["pl-", "pr-", "ml-", "mr-", "text-left", "text-right", "left-", "right-"];
    for (const banned of PHYSICAL_BANNED) {
      const re = new RegExp(`(^|\\s)${banned.replace(/[-]/g, "\\-")}`);
      expect(re.test(classes), `className must NOT contain physical util '${banned}'`).toBe(false);
    }
  });

  it("does not branch its className by locale: the class string is identical for ar and fr", () => {
    const { container: arContainer } = render(<DemoCard locale="ar" />);
    const arCard = arContainer.querySelector("[data-testid='demo-card']") as HTMLElement;

    const { container: frContainer } = render(<DemoCard locale="fr" />);
    const frCard = frContainer.querySelector("[data-testid='demo-card']") as HTMLElement;

    expect(arCard.className).toBe(frCard.className);
  });
});

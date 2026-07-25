// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const pathnameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

import { localePathFor, LocaleSwitcher } from "./locale-switcher";

describe("localePathFor", () => {
  it("replaces only the Locale segment and preserves the rest of a deep link", () => {
    expect(localePathFor("/ar/articles/an-essay", "fr")).toBe("/fr/articles/an-essay");
  });

  it("keeps the Locale root stable", () => {
    expect(localePathFor("/fr", "ar")).toBe("/ar");
  });

  it("swaps to the English Locale segment", () => {
    expect(localePathFor("/ar/articles/an-essay", "en")).toBe("/en/articles/an-essay");
  });

  it("swaps an English deep link back to Arabic", () => {
    expect(localePathFor("/en/about", "ar")).toBe("/ar/about");
  });
});

describe("LocaleSwitcher", () => {
  it("renders language links for the current deep link and marks the active Locale", () => {
    pathnameMock.mockReturnValue("/fr/about");

    render(<LocaleSwitcher locale="fr" />);

    expect(screen.getByRole("link", { name: "fr" })).toHaveAttribute("href", "/fr/about");
    expect(screen.getByRole("link", { name: "fr" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "ar" })).toHaveAttribute("href", "/ar/about");
    expect(screen.getByRole("link", { name: "en" })).toHaveAttribute("href", "/en/about");
  });

  it("marks the English link active on an English page", () => {
    pathnameMock.mockReturnValue("/en/articles/an-essay");

    render(<LocaleSwitcher locale="en" />);

    expect(screen.getByRole("link", { name: "en" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "en" })).toHaveAttribute("href", "/en/articles/an-essay");
    expect(screen.getByRole("link", { name: "en" })).toHaveAttribute("aria-label", "English");
  });
});

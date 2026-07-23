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
});

describe("LocaleSwitcher", () => {
  it("renders language links for the current deep link and marks the active Locale", () => {
    pathnameMock.mockReturnValue("/fr/about");

    render(<LocaleSwitcher locale="fr" />);

    expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr/about");
    expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "العربية" })).toHaveAttribute("href", "/ar/about");
  });
});

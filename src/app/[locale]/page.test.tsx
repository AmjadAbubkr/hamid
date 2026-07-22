// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("__NEXT_NOT_FOUND__");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: vi.fn((path: string) => {
    throw new Error(`__NEXT_REDIRECT__:${path}:`);
  }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: vi.fn(() => null),
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("next/font/local", () => ({}));

import LocalePage from "@/app/[locale]/page";
import { STRINGS } from "@/lib/i18n/strings";

function makeParams(locale: string) {
  return Promise.resolve({ locale });
}

describe("LocalePage (src/app/[locale]/page.tsx)", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("renders the Arabic Locale home page with the Arabic demo card title", async () => {
    const ui = await LocalePage({ params: makeParams("ar") });
    render(ui);
    expect(screen.getByText(STRINGS.ar.title)).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders the French Locale home page with the French demo card title", async () => {
    const ui = await LocalePage({ params: makeParams("fr") });
    render(ui);
    expect(screen.getByText(STRINGS.fr.title)).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown Locale code (en)", async () => {
    await expect(
      LocalePage({ params: makeParams("en") }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

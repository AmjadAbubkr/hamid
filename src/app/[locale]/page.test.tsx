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
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("next/font/local", () => ({}));

import LocalePage from "@/app/[locale]/page";

function makeParams(locale: string) {
  return Promise.resolve({ locale });
}

describe("LocalePage (src/app/[locale]/page.tsx)", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("renders the Arabic Locale home page with the official profile hero", async () => {
    const ui = await LocalePage({ params: makeParams("ar") });
    render(ui);
    expect(screen.getByRole("heading", { name: "Hamid Mahamat Azaz" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hamid Mahamat Azaz" })).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders the French Locale home page with the official current-role fallback", async () => {
    const ui = await LocalePage({ params: makeParams("fr") });
    render(ui);
    expect(screen.getByText("Inspecteur technique")).toBeInTheDocument();
    expect(screen.getByText("Ministère de la Communication")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown Locale code (en)", async () => {
    await expect(
      LocalePage({ params: makeParams("en") }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

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

const fontFactory = (name: string) => ({ variable: name });
vi.mock("next/font/google", () => ({
  Geist: () => fontFactory("--font-geist-sans"),
  Geist_Mono: () => fontFactory("--font-geist-mono"),
  Libre_Caslon_Text: () => fontFactory("--font-display"),
  Source_Sans_3: () => fontFactory("--font-body"),
  Noto_Naskh_Arabic: () => fontFactory("--font-naskh"),
}));

vi.mock("next/font/local", () => ({}));

// The home page pulls every Content Item type. By mocking each content service
// to return empty arrays, we force the hero through its hardcoded fallback
// role copy (the explicit scenario this test was written to pin — the only
// piece of the page that does not depend on the Editor having published
// anything yet) and exercise every section's empty-state branch. Declared via
// vi.hoisted so the vi.mock factories below can reference them safely.
const { noopAsync, taglineAsync, galleryPublicUrlMock } = vi.hoisted(() => ({
  noopAsync: vi.fn().mockResolvedValue([]),
  taglineAsync: vi.fn().mockResolvedValue(null),
  galleryPublicUrlMock: vi.fn().mockReturnValue(null),
}));
vi.mock("@/lib/content/positions", () => ({ getPublishedPositions: noopAsync }));
vi.mock("@/lib/content/articles", () => ({ getPublishedArticles: noopAsync }));
vi.mock("@/lib/content/gallery", () => ({
  getPublishedGalleryPhotos: noopAsync,
  galleryPublicUrl: galleryPublicUrlMock,
}));
vi.mock("@/lib/content/participations", () => ({
  getPublishedPastParticipations: noopAsync,
}));
vi.mock("@/lib/content/events", () => ({
  getPublishedUpcomingEvents: noopAsync,
}));

import LocalePage from "@/app/[locale]/page";

function makeParams(locale: string) {
  return Promise.resolve({ locale });
}

describe("LocalePage (src/app/[locale]/page.tsx)", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    noopAsync.mockClear();
    taglineAsync.mockClear();
    galleryPublicUrlMock.mockClear();
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

  it("renders the English Locale home page with the official current-role fallback", async () => {
    const ui = await LocalePage({ params: makeParams("en") });
    render(ui);
    expect(screen.getByText("Technical Inspector")).toBeInTheDocument();
    expect(screen.getByText("Ministry of Communication")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown Locale code (xx)", async () => {
    await expect(
      LocalePage({ params: makeParams("xx") }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

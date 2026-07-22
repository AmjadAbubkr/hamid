// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { getPublishedPositionsMock, getPublishedPositionBySlugMock, notFoundMock } =
  vi.hoisted(() => ({
    getPublishedPositionsMock: vi.fn(),
    getPublishedPositionBySlugMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("__NEXT_NOT_FOUND__");
    }),
  }));

vi.mock("@/lib/content/positions", () => ({
  getPublishedPositions: getPublishedPositionsMock,
  getPublishedPositionBySlug: getPublishedPositionBySlugMock,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import CareerPage from "./page";
import PositionDetailPage from "./[slug]/page";

const publishedPosition = {
  slug: "inspecteur-technique",
  titleAr: "مفتش تقني",
  titleFr: "Inspecteur technique",
  bodyAr: "ملخص",
  bodyFr: "Résumé",
  institution: "Ministère de la Communication",
  startDate: "2026-05-22",
  endDate: null,
  location: "N'Djamena, Tchad",
};

describe("public career pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the French timeline from the published-only content service", async () => {
    getPublishedPositionsMock.mockResolvedValue([publishedPosition]);

    render(await CareerPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Parcours professionnel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inspecteur technique" })).toHaveAttribute(
      "href",
      "/fr/career/inspecteur-technique",
    );
    expect(screen.queryByText("مفتش تقني")).not.toBeInTheDocument();
    expect(getPublishedPositionsMock).toHaveBeenCalledOnce();
  });

  it("returns a 404 when the published-only detail lookup finds no row", async () => {
    getPublishedPositionBySlugMock.mockResolvedValue(null);

    await expect(
      PositionDetailPage({
        params: Promise.resolve({ locale: "fr", slug: "draft-position" }),
      }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");

    expect(getPublishedPositionBySlugMock).toHaveBeenCalledWith("draft-position");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});

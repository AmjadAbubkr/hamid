// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const {
  getPublishedPositionsMock,
  getPublishedEducationEntriesMock,
  getPublishedEducationEntryBySlugMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getPublishedPositionsMock: vi.fn(),
  getPublishedEducationEntriesMock: vi.fn(),
  getPublishedEducationEntryBySlugMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("__NEXT_NOT_FOUND__");
  }),
}));

vi.mock("@/lib/content/positions", () => ({
  getPublishedPositions: getPublishedPositionsMock,
}));

vi.mock("@/lib/content/education", () => ({
  getPublishedEducationEntries: getPublishedEducationEntriesMock,
  getPublishedEducationEntryBySlug: getPublishedEducationEntryBySlugMock,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import CareerPage from "../page";
import EducationDetailPage from "./[slug]/page";

const publishedEducation = {
  slug: "master-relations-internationales",
  degreeAr: "ماجستير في العلاقات الدولية",
  degreeFr: "Master en relations internationales",
  institutionAr: "جامعة نجامينا",
  institutionFr: "Université de N'Djamena",
  honoursAr: null,
  honoursFr: null,
  startDate: "2018-09-01",
  endDate: "2020-06-30",
  location: "N'Djamena, Tchad",
};

describe("public Education Entry pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublishedPositionsMock.mockResolvedValue([]);
  });

  it("renders Education Entries after the Positions heading with a distinct URL", async () => {
    getPublishedEducationEntriesMock.mockResolvedValue([publishedEducation]);

    render(await CareerPage({ params: Promise.resolve({ locale: "fr" }) }));

    const headings = screen.getAllByRole("heading");
    expect(headings.map((heading) => heading.textContent)).toEqual(
      expect.arrayContaining(["Postes occupés", "Formation"]),
    );
    expect(screen.getByRole("link", { name: publishedEducation.degreeFr })).toHaveAttribute(
      "href",
      "/fr/career/education/master-relations-internationales",
    );
    expect(getPublishedEducationEntriesMock).toHaveBeenCalledOnce();
  });

  it("returns a 404 when the public Education Entry lookup finds no published row", async () => {
    getPublishedEducationEntryBySlugMock.mockResolvedValue(null);

    await expect(
      EducationDetailPage({
        params: Promise.resolve({ locale: "fr", slug: "draft-degree" }),
      }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");

    expect(getPublishedEducationEntryBySlugMock).toHaveBeenCalledWith("draft-degree");
  });
});

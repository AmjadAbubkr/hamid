// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const {
  getPublishedPositionsMock,
  getPublishedEducationEntriesMock,
  getPublishedPastParticipationsMock,
  getPublishedPastParticipationBySlugMock,
  getParticipationRoleLabelMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getPublishedPositionsMock: vi.fn(),
  getPublishedEducationEntriesMock: vi.fn(),
  getPublishedPastParticipationsMock: vi.fn(),
  getPublishedPastParticipationBySlugMock: vi.fn(),
  getParticipationRoleLabelMock: vi.fn(() => "Intervenant"),
  notFoundMock: vi.fn(() => {
    throw new Error("__NEXT_NOT_FOUND__");
  }),
}));

vi.mock("@/lib/content/positions", () => ({
  getPublishedPositions: getPublishedPositionsMock,
}));

vi.mock("@/lib/content/education", () => ({
  getPublishedEducationEntries: getPublishedEducationEntriesMock,
}));

vi.mock("@/lib/content/participations", () => ({
  getParticipationRoleLabel: getParticipationRoleLabelMock,
  getPublishedPastParticipations: getPublishedPastParticipationsMock,
  getPublishedPastParticipationBySlug: getPublishedPastParticipationBySlugMock,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import CareerPage from "../career/page";
import ParticipationDetailPage from "./[slug]/page";

const publishedParticipation = {
  slug: "cemac-forum-2018",
  titleAr: "منتدى الشباب",
  titleFr: "Forum de la jeunesse",
  bodyAr: null,
  bodyFr: null,
  eventDate: "2018-06-10",
  eventEndDate: null,
  eventDateLabel: "10 juin 2018",
  venueAr: "ياوندي",
  venueFr: "Yaoundé",
  institutionAr: "سيماك",
  institutionFr: "CEMAC",
  role: "Speaker" as const,
  roleOtherAr: null,
  roleOtherFr: null,
  sourceUrl: null,
};

describe("public Past Participation pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublishedPositionsMock.mockResolvedValue([]);
    getPublishedEducationEntriesMock.mockResolvedValue([]);
  });

  it("renders the third Career section with the non-colliding deep link", async () => {
    getPublishedPastParticipationsMock.mockResolvedValue([publishedParticipation]);

    render(await CareerPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Participations passées" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forum de la jeunesse" })).toHaveAttribute(
      "href",
      "/fr/participations/cemac-forum-2018",
    );
    expect(getPublishedPastParticipationsMock).toHaveBeenCalledOnce();
  });

  it("returns a 404 when no published participation matches the deep URL", async () => {
    getPublishedPastParticipationBySlugMock.mockResolvedValue(null);

    await expect(
      ParticipationDetailPage({
        params: Promise.resolve({ locale: "fr", slug: "draft-participation" }),
      }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");

    expect(getPublishedPastParticipationBySlugMock).toHaveBeenCalledWith(
      "draft-participation",
    );
  });
});

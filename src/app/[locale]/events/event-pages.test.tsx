// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const {
  getPublishedUpcomingEventsMock,
  getPublishedUpcomingEventBySlugMock,
  getParticipationRoleLabelMock,
  notFoundMock,
  emptyContentMock,
} = vi.hoisted(() => ({
  getPublishedUpcomingEventsMock: vi.fn(),
  getPublishedUpcomingEventBySlugMock: vi.fn(),
  getParticipationRoleLabelMock: vi.fn(() => "Intervenant"),
  notFoundMock: vi.fn(() => {
    throw new Error("__NEXT_NOT_FOUND__");
  }),
  emptyContentMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/content/events", () => ({
  getPublishedUpcomingEvents: getPublishedUpcomingEventsMock,
  getPublishedUpcomingEventsForListing: getPublishedUpcomingEventsMock,
  getPublishedUpcomingEventBySlug: getPublishedUpcomingEventBySlugMock,
}));

vi.mock("@/lib/content/participations", () => ({
  getParticipationRoleLabel: getParticipationRoleLabelMock,
  getPublishedPastParticipations: emptyContentMock,
}));

vi.mock("@/lib/content/positions", () => ({
  getPublishedPositions: emptyContentMock,
}));
vi.mock("@/lib/content/articles", () => ({
  getPublishedArticles: emptyContentMock,
}));
vi.mock("@/lib/content/gallery", () => ({
  getPublishedGalleryPhotos: emptyContentMock,
  galleryPublicUrl: vi.fn(),
}));

vi.mock("@/components/demo-card", () => ({
  DemoCard: () => <div>Profile introduction</div>,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("next/font/google", () => ({
  Libre_Caslon_Text: () => ({ variable: "--font-display" }),
  Source_Sans_3: () => ({ variable: "--font-body" }),
  Noto_Naskh_Arabic: () => ({ variable: "--font-naskh" }),
}));

import LocalePage from "../page";
import EventDetailPage from "./[slug]/page";
import EventsPage from "./page";

const upcomingEvent = {
  slug: "youth-forum",
  titleAr: "منتدى الشباب",
  titleFr: "Forum des jeunes",
  bodyAr: "ملخص",
  bodyFr: "Présentation",
  eventDate: "2030-06-12",
  venueAr: "انجمينا",
  venueFr: "N'Djamena",
  institutionAr: "المؤسسة",
  institutionFr: "Institution",
  role: "Speaker" as const,
  roleOtherAr: null,
  roleOtherFr: null,
  registrationUrl: "https://example.test/register",
};

describe("public Upcoming Event pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a stable empty Events page without an event card", async () => {
    getPublishedUpcomingEventsMock.mockResolvedValue([]);

    render(await EventsPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Événements à venir" })).toBeInTheDocument();
    expect(screen.getByText("Aucun événement n’est programmé pour le moment.")).toBeInTheDocument();
  });

  it("shows only the next three event cards on the homepage", async () => {
    getPublishedUpcomingEventsMock.mockResolvedValue([
      upcomingEvent,
      { ...upcomingEvent, slug: "event-2", titleFr: "Événement 2" },
      { ...upcomingEvent, slug: "event-3", titleFr: "Événement 3" },
      { ...upcomingEvent, slug: "event-4", titleFr: "Événement 4" },
    ]);

    render(await LocalePage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Événements à venir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forum des jeunes" })).toHaveAttribute("href", "/fr/events/youth-forum");
    expect(screen.getByRole("link", { name: "Événement 3" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Événement 4" })).not.toBeInTheDocument();
  });

  it("returns a 404 for a draft or expired event detail URL", async () => {
    getPublishedUpcomingEventBySlugMock.mockResolvedValue(null);

    await expect(
      EventDetailPage({ params: Promise.resolve({ locale: "fr", slug: "draft-event" }) }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");

    expect(getPublishedUpcomingEventBySlugMock).toHaveBeenCalledWith("draft-event");
  });
});

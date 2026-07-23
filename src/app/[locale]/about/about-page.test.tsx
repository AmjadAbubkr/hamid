// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getPublishedTagline: vi.fn(),
  getPublishedPositions: vi.fn(),
  getPublishedEducationEntries: vi.fn(),
  getPublishedPastParticipations: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/content/tagline", () => ({
  getPublishedTagline: mocks.getPublishedTagline,
}));
vi.mock("@/lib/content/positions", () => ({
  getPublishedPositions: mocks.getPublishedPositions,
}));
vi.mock("@/lib/content/education", () => ({
  getPublishedEducationEntries: mocks.getPublishedEducationEntries,
}));
vi.mock("@/lib/content/participations", () => ({
  getPublishedPastParticipations: mocks.getPublishedPastParticipations,
}));
vi.mock("@/components/motion-reveal", () => ({
  PageEntrance: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  MotionReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import AboutPage, { generateMetadata } from "./page";

describe("About page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublishedTagline.mockResolvedValue({ textAr: "", textFr: "Une voix personnelle et publique." });
    mocks.getPublishedPositions.mockResolvedValue([
      {
        slug: "current-role",
        titleAr: "المنصب الحالي",
        titleFr: "Fonction actuelle",
        bodyAr: null,
        bodyFr: null,
        institution: "Institution actuelle",
        startDate: "2026-05-22",
        endDate: null,
        location: "N'Djamena",
      },
      {
        slug: "former-role",
        titleAr: "منصب سابق",
        titleFr: "Fonction précédente",
        bodyAr: null,
        bodyFr: null,
        institution: "Institution précédente",
        startDate: "2024-01-01",
        endDate: "2025-01-01",
        location: "N'Djamena",
      },
    ]);
    mocks.getPublishedEducationEntries.mockResolvedValue([
      {
        slug: "degree",
        degreeAr: "شهادة",
        degreeFr: "Diplôme",
        institutionAr: "جامعة",
        institutionFr: "Université",
        honoursAr: null,
        honoursFr: null,
        startDate: "2010-01-01",
        endDate: "2012-01-01",
        location: "N'Djamena",
      },
    ]);
    mocks.getPublishedPastParticipations.mockResolvedValue([
      {
        slug: "appearance",
        titleAr: "مشاركة",
        titleFr: "Participation",
        bodyAr: null,
        bodyFr: null,
        eventDate: "2025-01-01",
        eventEndDate: null,
        eventDateLabel: "2025",
        venueAr: "نجامينا",
        venueFr: "N'Djamena",
        institutionAr: "مؤسسة",
        institutionFr: "Institution",
        role: "Speaker",
        roleOtherAr: null,
        roleOtherFr: null,
        sourceUrl: null,
      },
    ]);
  });

  it("assembles structured published Content Items without requiring both Tagline strings to render", async () => {
    render(await AboutPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "À propos" })).toBeInTheDocument();
    expect(screen.getByText("Une voix personnelle et publique.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fonction actuelle", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fonction précédente", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Diplôme", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Participation", level: 3 })).toBeInTheDocument();
    expect(screen.getByTestId("canonical-footer")).toHaveTextContent("/fr/about");
  });

  it("publishes correct per-Locale alternate links for the About URL", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "fr" }) });

    expect(metadata.alternates).toMatchObject({
      canonical: "/fr/about",
      languages: { ar: "/ar/about", fr: "/fr/about" },
    });
  });
});

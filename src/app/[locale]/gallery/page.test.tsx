// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getPublishedGalleryPhotosMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn(() => { throw new Error("__NEXT_NOT_FOUND__"); }));

vi.mock("@/lib/content/gallery", () => ({
  getPublishedGalleryPhotos: getPublishedGalleryPhotosMock,
  galleryPublicUrl: vi.fn(() => "https://example.com/gallery.jpg"),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

import GalleryPage from "./page";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("GalleryPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders an empty French gallery with the route canonical footer", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://hamid.example/";
    getPublishedGalleryPhotosMock.mockResolvedValue([]);

    render(await GalleryPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Galerie" })).toBeInTheDocument();
    expect(screen.getByText("Aucune photo publiée pour le moment.")).toBeInTheDocument();
    expect(screen.getByTestId("canonical-footer")).toHaveTextContent("/fr/gallery");
  });
});

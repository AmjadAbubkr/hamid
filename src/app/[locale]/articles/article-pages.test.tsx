// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const {
  getPublishedArticlesMock,
  getPublishedArticleBySlugMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getPublishedArticlesMock: vi.fn(),
  getPublishedArticleBySlugMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("__NEXT_NOT_FOUND__");
  }),
}));

vi.mock("@/lib/content/articles", () => ({
  getPublishedArticles: getPublishedArticlesMock,
  getPublishedArticleBySlug: getPublishedArticleBySlugMock,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import ArticleDetailPage from "./[slug]/page";
import ArticlesPage from "./page";

describe("public Article pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a stable empty listing", async () => {
    getPublishedArticlesMock.mockResolvedValue([]);

    render(await ArticlesPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { name: "Articles" })).toBeInTheDocument();
    expect(screen.getByText("Aucun article publié pour le moment.")).toBeInTheDocument();
  });

  it("returns a 404 for a draft Article URL", async () => {
    getPublishedArticleBySlugMock.mockResolvedValue(null);

    await expect(
      ArticleDetailPage({ params: Promise.resolve({ locale: "fr", slug: "draft-article" }) }),
    ).rejects.toThrow("__NEXT_NOT_FOUND__");

    expect(getPublishedArticleBySlugMock).toHaveBeenCalledWith("draft-article");
  });
});

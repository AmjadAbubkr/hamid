// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ "aria-label": label }: { "aria-label"?: string }) => <div aria-label={label} />,
  useEditor: () => null,
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: { configure: () => ({}) },
}));

import { ArticleForm } from "./article-form";

describe("ArticleForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses the Article API to save a draft instead of exposing a browser table write", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      article: { id: "article-id", slug: "essay", status: "draft" },
    }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ArticleForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "essay" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/portal/articles", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"action":"save"'),
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/portal/articles/essay");
  });

  it("states the site-original boundary and gives a soft warning for an institutional title", () => {
    render(<ArticleForm />);

    expect(screen.getByText("What kind of piece is this? Op-ed, essay, policy brief, published article.")).toBeInTheDocument();
    expect(screen.queryByText(/Statement or Communiqu/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("French title"), { target: { value: "Communiqué officiel" } });
    expect(screen.getByRole("status")).toHaveTextContent("Site-original content only");
  });
});

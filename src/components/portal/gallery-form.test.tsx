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

import { GalleryForm } from "./gallery-form";

describe("GalleryForm", () => {
  beforeEach(() => vi.resetAllMocks());

  it("checks the image type in the browser before it can be uploaded", () => {
    render(<GalleryForm />);

    fireEvent.change(screen.getByLabelText("Gallery image file"), {
      target: { files: [new File(["not an image"], "portrait.gif", { type: "image/gif" })] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a JPEG, PNG, or WebP image.");
  });

  it("sends multipart data to the protected Gallery API and only then redirects to edit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      photo: { id: "photo-id", slug: "summit", status: "draft", storage_path: "editor/photo.jpg" },
    }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<GalleryForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "summit" } });
    fireEvent.change(screen.getByLabelText("Gallery image file"), {
      target: { files: [new File([pngBytes()], "صورة.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/portal/gallery", expect.objectContaining({ method: "POST", body: expect.any(FormData) }));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("action")).toBe("save");
    expect((body.get("image") as File).name).toBe("صورة.png");
    expect(mocks.replace).toHaveBeenCalledWith("/portal/gallery/summit");
  });

  it("offers a reversible move to draft for a published image", () => {
    render(<GalleryForm photo={{ id: "photo-id", slug: "summit", status: "published", storage_path: "editor/photo.jpg" }} />);

    expect(screen.getByRole("button", { name: "Move to draft" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });
});

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

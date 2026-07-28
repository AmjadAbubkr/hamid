import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getCurrentEditorId: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  getUser: vi.fn(),
  requestRpc: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getCurrentEditorId: mocks.getCurrentEditorId,
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST } from "./route";

describe("POST /api/portal/gallery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createSupabaseServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
      rpc: mocks.requestRpc,
    });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user-id" } } });
    mocks.getCurrentEditorId.mockResolvedValue("editor-id");
    mocks.single.mockResolvedValue({
      data: { id: "photo-id", slug: "summit", status: "draft", storage_path: "editor-id/photo.png" },
      error: null,
    });
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.download.mockResolvedValue({ data: new Blob([pngBytes()], { type: "image/png" }), error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.storageFrom.mockReturnValue({ upload: mocks.upload, download: mocks.download, remove: mocks.remove });
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: mocks.from,
      storage: { from: mocks.storageFrom },
    });
    mocks.from.mockReturnValue({ insert: mocks.insert });
  });

  it("requires an authenticated Editor before reading or writing Storage", async () => {
    mocks.getCurrentEditorId.mockResolvedValue(null);

    const response = await POST(galleryRequest({ action: "save" }));

    expect(response.status).toBe(403);
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("uploads to private staging, copies to public before publishing, and never exposes a browser Storage write", async () => {
    mocks.requestRpc.mockResolvedValue({ error: null });

    const response = await POST(galleryRequest({ action: "publish", image: pngFile() }));

    expect(response.status).toBe(201);
    expect(mocks.storageFrom).toHaveBeenCalledWith("gallery-staging");
    expect(mocks.storageFrom).toHaveBeenCalledWith("gallery-public");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      slug: "summit",
      status: "draft",
      storage_path: expect.stringMatching(/^editor-id\/.+\.png$/),
    }));
    expect(mocks.requestRpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "gallery_photo",
      item_id: "photo-id",
    });
  });

  it("rejects a non-image payload before it touches private Storage", async () => {
    const response = await POST(galleryRequest({
      action: "save",
      image: new File([new Uint8Array([0x47, 0x49, 0x46])], "portrait.gif", { type: "image/gif" }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("restores the public object if moving a published photo to draft cannot save the row", async () => {
    const findMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "photo-id",
        slug: "summit",
        status: "published",
        storage_path: "editor-id/original.jpg",
        author_editor_id: "editor-id",
      },
      error: null,
    });
    const updateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error("database unavailable") });
    mocks.from
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: findMaybeSingle }) }),
        }),
      })
      .mockReturnValueOnce({
        update: () => ({
          eq: () => ({ eq: () => ({ select: () => ({ maybeSingle: updateMaybeSingle }) }) }),
        }),
      });

    const response = await POST(galleryRequest({ action: "unpublish", id: "photo-id" }));

    expect(response.status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledWith(["editor-id/original.jpg"]);
    expect(mocks.upload).toHaveBeenCalledWith("editor-id/original.jpg", expect.any(Blob), { upsert: true });
    expect(mocks.storageFrom).toHaveBeenCalledWith("gallery-public");
    expect(mocks.storageFrom).toHaveBeenCalledWith("gallery-staging");
  });
});

function galleryRequest({ action, image, id }: { action: string; image?: File; id?: string }) {
  const formData = new FormData();
  formData.set("action", action);
  if (id) formData.set("id", id);
  formData.set("slug", "summit");
  formData.set("caption_ar", "تعليق");
  formData.set("caption_fr", "Légende");
  formData.set("caption_en", "Caption");
  formData.set("taken_date", "2026-07-22");
  if (image) formData.set("image", image, image.name);
  return new NextRequest("https://profile.example/api/portal/gallery", { method: "POST", body: formData });
}

function pngFile() {
  return new File([pngBytes()], "صورة.png", { type: "image/png" });
}

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

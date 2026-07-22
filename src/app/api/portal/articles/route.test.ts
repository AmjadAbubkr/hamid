import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getCurrentEditorId: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  getUser: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  rpc: vi.fn(),
  requestRpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getCurrentEditorId: mocks.getCurrentEditorId,
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST } from "./route";

describe("POST /api/portal/articles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createSupabaseServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
      rpc: mocks.requestRpc,
    });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user-id" } } });
    mocks.getCurrentEditorId.mockResolvedValue("editor-id");
    mocks.single.mockResolvedValue({ data: { id: "article-id", slug: "essay", status: "draft" }, error: null });
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: () => ({ insert: mocks.insert }),
      rpc: mocks.rpc,
    });
  });

  it("requires an authenticated Editor before it uses the server write client", async () => {
    mocks.getCurrentEditorId.mockResolvedValue(null);

    const response = await POST(articleRequest({ slug: "essay" }));

    expect(response.status).toBe(403);
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("sanitizes both bodies, saves first, then publishes through the existing RPC", async () => {
    mocks.requestRpc.mockResolvedValue({ error: null });

    const response = await POST(articleRequest({
      slug: "essay",
      title_ar: "عنوان",
      title_fr: "Titre",
      body_ar: '<p>نص<script>alert(1)</script></p>',
      body_fr: '<p>Texte<iframe src="https://evil.example"></iframe></p>',
      published_date: "2025-01-01",
      action: "publish",
    }));

    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      body_ar: "<p>نص</p>",
      body_fr: "<p>Texte</p>",
    }));
    expect(mocks.requestRpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "article",
      item_id: "article-id",
    });
  });
});

function articleRequest(body: Record<string, unknown>) {
  return new NextRequest("https://profile.example/api/portal/articles", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

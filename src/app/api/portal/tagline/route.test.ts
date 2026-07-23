import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getCurrentEditorId: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  getUser: vi.fn(),
  requestRpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getCurrentEditorId: mocks.getCurrentEditorId,
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { GET, POST } from "./route";

describe("/api/portal/tagline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createSupabaseServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
      rpc: mocks.requestRpc,
    });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user-id" } } });
    mocks.getCurrentEditorId.mockResolvedValue("editor-id");
    mocks.getSupabaseAdminClient.mockReturnValue({ from: mocks.from });
  });

  it("requires an authenticated Editor before it can read or claim the singleton", async () => {
    mocks.getCurrentEditorId.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("claims the ownerless seed exactly once for the verified Editor", async () => {
    const seed = { id: "tagline-id", status: "draft", tagline_ar: "", tagline_fr: "", author_editor_id: null };
    const claimed = { ...seed, author_editor_id: "editor-id" };
    mocks.from
      .mockReturnValueOnce(selectSingleton(seed))
      .mockReturnValueOnce(claimSingleton(claimed));

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ tagline: claimed }));
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("saves a Draft first and then publishes through the request-bound session RPC", async () => {
    const owned = { id: "tagline-id", status: "draft", tagline_ar: "", tagline_fr: "", author_editor_id: "editor-id" };
    const saved = { ...owned, tagline_ar: "سطر", tagline_fr: "Une phrase" };
    mocks.from
      .mockReturnValueOnce(selectSingleton(owned))
      .mockReturnValueOnce(saveSingleton(saved));
    mocks.requestRpc.mockResolvedValue({ error: null });

    const response = await POST(request({
      tagline_ar: "سطر",
      tagline_fr: "Une phrase",
      action: "publish",
    }));

    expect(response.status).toBe(200);
    expect(mocks.requestRpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "tagline",
      item_id: "tagline-id",
    });
  });
});

function request(body?: Record<string, unknown>) {
  return new NextRequest("https://profile.example/api/portal/tagline", body
    ? { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }
    : { method: "GET" });
}

function selectSingleton(data: Record<string, unknown>) {
  return {
    select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }) }),
  };
}

function claimSingleton(data: Record<string, unknown>) {
  return {
    update: () => ({
      eq: () => ({
        is: () => ({
          select: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }),
        }),
      }),
    }),
  };
}

function saveSingleton(data: Record<string, unknown>) {
  return {
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }),
        }),
      }),
    }),
  };
}

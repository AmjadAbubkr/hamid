import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getCurrentEditorId: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getCurrentEditorId: mocks.getCurrentEditorId,
}));

import { middleware } from "./middleware";

describe("Portal middleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createSupabaseServerClient.mockImplementation((cookies) => ({
      auth: {
        getUser: async () => {
          cookies.setAll([{ name: "sb-refresh", value: "rotated", options: { path: "/" } }]);
          return mocks.getUser();
        },
      },
    }));
  });

  it("redirects an authenticated non-Editor away from a private Portal route", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "not-an-editor" } } });
    mocks.getCurrentEditorId.mockResolvedValue(null);

    const response = await middleware(new NextRequest("https://profile.example/portal"));

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/portal/login");
  });

  it("keeps rotated session cookies when an Editor is redirected from login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "editor-user" } } });
    mocks.getCurrentEditorId.mockResolvedValue("editor-id");

    const response = await middleware(new NextRequest("https://profile.example/portal/login"));

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/portal");
    expect(response.cookies.get("sb-refresh")?.value).toBe("rotated");
  });
});

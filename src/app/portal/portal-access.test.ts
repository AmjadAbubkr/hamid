import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getCurrentEditorId: vi.fn(),
  hasActiveRecoveryEnrollment: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getCurrentEditorId: mocks.getCurrentEditorId,
}));
vi.mock("@/lib/portal-auth/recovery-service", () => ({
  RECOVERY_ENROLLMENT_COOKIE: "portal_recovery_enrollment",
  hasActiveRecoveryEnrollment: mocks.hasActiveRecoveryEnrollment,
}));

import { getPortalAccess } from "@/app/portal/portal-access";

describe("getPortalAccess", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookies.mockResolvedValue({
      getAll: () => [],
      get: () => undefined,
    });
    mocks.createSupabaseServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
    });
  });

  it("rejects an authenticated user who has no matching Editor record", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "not-an-editor" } } });
    mocks.getCurrentEditorId.mockResolvedValue(null);

    await expect(getPortalAccess()).resolves.toEqual({
      isAuthenticated: false,
      recoveryActive: false,
    });
    expect(mocks.hasActiveRecoveryEnrollment).not.toHaveBeenCalled();
  });
});

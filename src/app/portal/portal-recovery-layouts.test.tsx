import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  getPortalAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/app/portal/portal-access", () => ({ getPortalAccess: mocks.getPortalAccess }));

import NormalPortalLayout from "@/app/portal/(normal)/layout";
import RecoveryPortalLayout from "@/app/portal/(recovery)/layout";

const { redirect, getPortalAccess } = mocks;

describe("Portal recovery layouts", () => {
  beforeEach(() => {
    redirect.mockReset();
    getPortalAccess.mockReset();
  });

  it("sends unauthenticated normal Portal requests to passkey sign-in", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: false, recoveryActive: false });

    await NormalPortalLayout({ children: <p>Portal</p> });

    expect(redirect).toHaveBeenCalledWith("/portal/login");
  });

  it("locks active recovery sessions out of normal Portal pages", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: true, recoveryActive: true });

    await NormalPortalLayout({ children: <p>Portal</p> });

    expect(redirect).toHaveBeenCalledWith("/portal/re-enroll");
  });

  it("allows a normal Portal page after recovery is not active", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: true, recoveryActive: false });
    const children = <p>Portal</p>;

    const result = await NormalPortalLayout({ children });

    expect(result).toBe(children);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sends unauthenticated recovery re-enrollment requests to passkey sign-in", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: false, recoveryActive: false });

    await RecoveryPortalLayout({ children: <p>Re-enroll</p> });

    expect(redirect).toHaveBeenCalledWith("/portal/login");
  });

  it("rejects re-enrollment when the recovery session is absent or complete", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: true, recoveryActive: false });

    await RecoveryPortalLayout({ children: <p>Re-enroll</p> });

    expect(redirect).toHaveBeenCalledWith("/portal");
  });

  it("allows re-enrollment only while the recovery session is active", async () => {
    getPortalAccess.mockResolvedValue({ isAuthenticated: true, recoveryActive: true });
    const children = <p>Re-enroll</p>;

    const result = await RecoveryPortalLayout({ children });

    expect(result).toBe(children);
    expect(redirect).not.toHaveBeenCalled();
  });
});

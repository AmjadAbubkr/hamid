// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PortalLoginPage from "@/app/portal/(public)/login/page";
import PortalPage from "@/app/portal/(normal)/page";
import PortalRecoverPage from "@/app/portal/(public)/recover/page";
import PortalReEnrollPage from "@/app/portal/(recovery)/re-enroll/page";
import PortalRecoveryCodePage from "@/app/portal/(normal)/recovery-code/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

describe("Portal routes", () => {
  it("renders the passkey-only Portal login route", () => {
    render(<PortalLoginPage />);

    expect(screen.getByRole("heading", { name: "Portal sign-in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in with passkey" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("renders the authenticated Portal route with first-passkey enrollment and logout", () => {
    render(<PortalPage />);

    expect(screen.getByRole("heading", { name: "Logged in as Hamid / Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enroll this passkey" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("renders the numeric-code recovery route", () => {
    render(<PortalRecoverPage />);

    expect(screen.getByRole("heading", { name: "Recover Portal access" })).toBeInTheDocument();
    expect(screen.getByLabelText("Recovery code")).toBeInTheDocument();
  });

  it("renders the mandatory re-enrollment route", () => {
    render(<PortalReEnrollPage />);

    expect(screen.getByRole("heading", { name: "Enroll a replacement passkey" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enroll a new passkey" })).toBeInTheDocument();
  });

  it("renders the one-time recovery-code route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    render(<PortalRecoveryCodePage />);

    expect(screen.getByRole("heading", { name: "Store your recovery code" })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("The recovery code could not be shown.");
  });
});

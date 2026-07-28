// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  EmailPasswordLoginControls,
  PasskeyLoginControls,
  PasskeyReEnrollment,
  PasswordResetRequestForm,
  PasswordUpdateForm,
  PortalLogout,
  RecoveryCodeDisplay,
  RecoveryCodeForm,
} from "@/components/portal/portal-auth-controls";
import { EmailAccessControls } from "@/components/portal/email-access-controls";

const replace = vi.fn();
const supabaseAuth = {
  signInWithPasskey: vi.fn(),
  signInWithPassword: vi.fn(),
  registerPasskey: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: supabaseAuth }),
}));

describe("Portal authentication controls", () => {
  beforeEach(() => {
    replace.mockReset();
    supabaseAuth.signInWithPasskey.mockReset();
    supabaseAuth.signInWithPassword.mockReset();
    supabaseAuth.registerPasskey.mockReset();
    supabaseAuth.resetPasswordForEmail.mockReset();
    supabaseAuth.signOut.mockReset();
    supabaseAuth.updateUser.mockReset();
    vi.unstubAllGlobals();
  });

  it("starts a passkey-only sign-in and sends the Editor to the Portal", async () => {
    supabaseAuth.signInWithPasskey.mockResolvedValue({ data: {}, error: null });
    render(<PasskeyLoginControls />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with passkey" }));

    await waitFor(() => {
      expect(supabaseAuth.signInWithPasskey).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith("/portal");
    });
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("signs an existing Editor in with their email and password", async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    render(<EmailPasswordLoginControls />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "editor@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secure-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with email and password" }));

    await waitFor(() => {
      expect(supabaseAuth.signInWithPassword).toHaveBeenCalledWith({ email: "editor@example.com", password: "secure-password" });
      expect(replace).toHaveBeenCalledWith("/portal");
    });
  });

  it("sends a secure password setup link before a first-time Editor sets a password", async () => {
    supabaseAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    render(<EmailAccessControls />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "editor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Set up or reset password" }));

    await waitFor(() => {
      expect(supabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        "editor@example.com",
        expect.objectContaining({ redirectTo: `${window.location.origin}/auth/callback?next=/portal/reset-password` }),
      );
      expect(screen.getByText(/secure password link has been sent/i)).toBeInTheDocument();
    });
  });

  it("shows password sign-in only after an existing Editor chooses it", () => {
    render(<EmailAccessControls />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "editor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "I already have a password" }));

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("does not disclose whether an email address has a Portal account during password reset", async () => {
    supabaseAuth.resetPasswordForEmail.mockRejectedValue(new Error("User not found"));
    render(<PasswordResetRequestForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "unknown@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send password-reset link" }));

    expect(await screen.findByText(/If this email belongs to an Editor account/i)).toBeInTheDocument();
  });

  it("requires matching passwords before updating an Editor password", async () => {
    render(<PasswordUpdateForm />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-secure-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByText("The passwords do not match.")).toBeInTheDocument();
    expect(supabaseAuth.updateUser).not.toHaveBeenCalled();
  });

  it("starts authenticated passkey enrollment without exposing a public signup", async () => {
    supabaseAuth.registerPasskey.mockResolvedValue({ data: {}, error: null });
    render(<PasskeyLoginControls />);

    fireEvent.click(screen.getByRole("button", { name: "Enroll this passkey" }));

    await waitFor(() => {
      expect(supabaseAuth.registerPasskey).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith("/portal/recovery-code");
    });
    expect(screen.getByText(/does not create an Editor account/i)).toBeInTheDocument();
  });

  it("submits a numeric recovery code and accepts only the local recovery bridge", async () => {
    const originalWindow = window;
    const assign = vi.fn();
    vi.stubGlobal(
      "window",
      new Proxy(originalWindow, {
        get(target, property, receiver) {
          if (property === "location") {
            return { origin: "http://localhost", assign };
          }
          return Reflect.get(target, property, receiver);
        },
      }),
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: "/api/portal/recovery-bridge" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RecoveryCodeForm />);

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "12345678901234567890" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to passkey re-enrollment" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/portal/recover",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: "12345678901234567890" }),
        }),
      );
      expect(assign).toHaveBeenCalledWith("/api/portal/recovery-bridge");
    });
  });

  it("does not disclose whether a submitted recovery code is valid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
    render(<RecoveryCodeForm />);

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "12345678901234567890" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to passkey re-enrollment" }));

    expect(
      await screen.findByText("We could not continue the recovery process. Use a new recovery code or contact the developer."),
    ).toBeInTheDocument();
  });

  it("shows a recovery code once without retaining it in the browser", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "12345678901234567890" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RecoveryCodeDisplay />);

    expect(await screen.findByText("12345678901234567890")).toBeInTheDocument();
    expect(screen.getByText(/Store it offline/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/recovery-code",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("requires a fresh passkey before completing recovery", async () => {
    supabaseAuth.registerPasskey.mockResolvedValue({ data: {}, error: null });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PasskeyReEnrollment />);

    fireEvent.click(screen.getByRole("button", { name: "Enroll a new passkey" }));

    await waitFor(() => {
      expect(supabaseAuth.registerPasskey).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/portal/recovery-complete",
        expect.objectContaining({ method: "POST" }),
      );
      expect(replace).toHaveBeenCalledWith("/portal/recovery-code");
    });
  });

  it("clears the Supabase session before returning to passkey sign-in", async () => {
    supabaseAuth.signOut.mockResolvedValue({ error: null });
    render(<PortalLogout />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(supabaseAuth.signOut).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith("/portal/login");
    });
  });
});

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { usePortalLocale } from "./portal-locale-provider";

type ActionState = "idle" | "working" | "error";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isRecoveryRedirect(path: unknown): path is string {
  if (typeof path !== "string" || typeof window === "undefined") return false;

  const url = new URL(path, window.location.origin);
  return url.origin === window.location.origin && url.pathname === "/api/portal/recovery-bridge" && url.search === "";
}

export function PasskeyLoginControls() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function signIn() {
    setAction("working");
    setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithPasskey();
      if (error) throw error;
      router.replace("/portal");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("Passkey sign-in could not be completed.")));
      return;
    }
    setAction("idle");
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Passkey authentication">
      <p className="text-base text-zinc-700">
        {t("Use a passkey from this device or a hardware security key. Email and password are available as a fallback below.")}
      </p>
      <button
        type="button"
        onClick={signIn}
        disabled={action === "working"}
        className="rounded-md bg-zinc-950 px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {action === "working" ? t("Waiting for passkey…") : t("Sign in with passkey")}
      </button>
      <PasskeyEnrollment />
      {action === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}

export function EmailPasswordLoginControls({
  email: initialEmail = "",
  showEmail = true,
}: {
  email?: string;
  showEmail?: boolean;
} = {}) {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAction("working");
    setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.replace("/portal");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("Email and password sign-in could not be completed.")));
      return;
    }
    setAction("idle");
  }

  return (
    <form onSubmit={signIn} className="flex flex-col gap-3 border-t border-line pt-6" aria-label="Email and password authentication">
      <p className="text-sm text-muted">{t("Use email and password if your passkey is unavailable.")}</p>
      {showEmail ? (
        <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="portal-email">
          {t("Email")}
          <input id="portal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="portal-password">
        {t("Password")}
        <input id="portal-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
      </label>
      <button type="submit" disabled={action === "working"} className="rounded border border-ink px-4 py-3 text-base font-semibold text-ink transition-transform active:scale-[0.96] disabled:opacity-60">
        {action === "working" ? t("Signing in…") : t("Sign in with email and password")}
      </button>
      <a href="/portal/password-reset" className="text-sm font-semibold text-gold underline underline-offset-4">{t("Forgot password?")}</a>
      {action === "error" ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
    </form>
  );
}

export function PasswordResetRequestForm() {
  const { t } = usePortalLocale();
  const [email, setEmail] = useState("");
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAction("working");
    setMessage("");
    try {
      const redirectTo = new URL("/auth/callback?next=/portal/reset-password", window.location.origin).toString();
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    } catch {
      // Do not disclose which email addresses belong to Editor accounts.
    }
    setAction("idle");
    setMessage(t("If this email belongs to an Editor account, a password-reset link has been sent."));
  }

  return (
    <form onSubmit={requestReset} className="flex flex-col gap-4" aria-label="Password reset">
      <p className="text-base text-muted">{t("Enter your Editor email address to receive a password-reset link.")}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="portal-reset-email">
        {t("Email")}
        <input id="portal-reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
      </label>
      <button type="submit" disabled={action === "working"} className="rounded bg-ink px-4 py-3 text-base font-semibold text-white disabled:opacity-60">
        {action === "working" ? t("Sending…") : t("Send password-reset link")}
      </button>
      {message ? <p role="status" className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}

export function PasswordUpdateForm() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmation) {
      setAction("error");
      setMessage(t("The passwords do not match."));
      return;
    }
    setAction("working");
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace("/portal");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("Your password could not be updated.")));
      return;
    }
    setAction("idle");
  }

  return (
    <form onSubmit={updatePassword} className="flex flex-col gap-4" aria-label="Set a new password">
      <p className="text-base text-muted">{t("Choose a new password for your Editor account.")}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="new-password">
        {t("New password")}
        <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="confirm-new-password">
        {t("Confirm new password")}
        <input id="confirm-new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
      </label>
      <button type="submit" disabled={action === "working"} className="rounded bg-ink px-4 py-3 text-base font-semibold text-white disabled:opacity-60">
        {action === "working" ? t("Saving…") : t("Set new password")}
      </button>
      {action === "error" ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
    </form>
  );
}

export function PasskeyEnrollment() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function enroll() {
    setAction("working");
    setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.registerPasskey();
      if (error) throw error;
      router.replace("/portal/recovery-code");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("Passkey enrollment could not be completed.")));
      return;
    }
    setAction("idle");
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Passkey enrollment">
      <p className="text-sm text-zinc-700">
        {t("Enroll a passkey only after the developer bootstrap or an approved recovery session. This does not create an Editor account.")}
      </p>
      <button
        type="button"
        onClick={enroll}
        disabled={action === "working"}
        className="rounded-md border border-zinc-950 px-4 py-3 text-base font-semibold text-zinc-950 disabled:opacity-60"
      >
        {t("Enroll this passkey")}
      </button>
      {action === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}

export function RecoveryCodeForm() {
  const { t } = usePortalLocale();
  const [code, setCode] = useState("");
  const [action, setAction] = useState<ActionState>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAction("working");

    try {
      const response = await fetch("/api/portal/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const redirectTo =
        payload && typeof payload === "object" && "redirectTo" in payload
          ? (payload as { redirectTo?: unknown }).redirectTo
          : undefined;

      if (!response.ok || !isRecoveryRedirect(redirectTo)) throw new Error("Recovery failed");
      window.location.assign(redirectTo);
    } catch {
      setAction("error");
      return;
    }
    setAction("idle");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <p className="text-base text-zinc-700">
        {t("Enter the offline recovery code. It unlocks a one-time magic-link enrollment bridge only; it cannot sign you in to the Portal.")}
      </p>
      <label className="flex flex-col gap-2 text-base font-semibold text-zinc-950">
        {t("Recovery code")}
        <input
          name="recovery-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          minLength={20}
          maxLength={20}
          required
          className="rounded-md border border-zinc-400 px-3 py-3 font-mono text-lg text-zinc-950"
        />
      </label>
      <button
        type="submit"
        disabled={action === "working" || code.length !== 20}
        className="rounded-md bg-zinc-950 px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {action === "working" ? t("Checking recovery code…") : t("Continue to passkey re-enrollment")}
      </button>
      {action === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {t("We could not continue the recovery process. Use a new recovery code or contact the developer.")}
        </p>
      ) : null}
    </form>
  );
}

export function RecoveryCodeDisplay() {
  const { t } = usePortalLocale();
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCode() {
      try {
        const response = await fetch("/api/portal/recovery-code", {
          method: "POST",
          headers: { "cache-control": "no-store" },
        });
        const payload: unknown = await response.json();
        const nextCode =
          payload && typeof payload === "object" && "code" in payload
            ? (payload as { code?: unknown }).code
            : undefined;
        if (!response.ok || typeof nextCode !== "string" || !/^\d{20}$/.test(nextCode)) {
          throw new Error("Recovery code unavailable");
        }
        if (active) setCode(nextCode);
      } catch {
        if (active) setFailed(true);
      }
    }

    void loadCode();
    return () => {
      active = false;
    };
  }, []);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {t("The recovery code could not be shown. Do not proceed until the developer has verified enrollment.")}
      </p>
    );
  }

  if (!code) {
    return <p className="text-base text-zinc-700">{t("Preparing your one-time recovery code…")}</p>;
  }

  return (
    <section className="flex flex-col gap-4" aria-label="One-time recovery code">
      <p className="text-base text-zinc-700">
        {t("Store it offline now. You will not see this recovery code again. It is the only fallback if every passkey is lost.")}
      </p>
      <output className="rounded-md border border-zinc-950 bg-zinc-100 p-4 font-mono text-xl text-zinc-950">
        {code}
      </output>
      <p className="text-sm text-zinc-700">{t("Do not save it in this browser, email, or a chat message.")}</p>
    </section>
  );
}

export function PasskeyReEnrollment() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function enroll() {
    setAction("working");
    setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.registerPasskey();
      if (error) throw error;

      const response = await fetch("/api/portal/recovery-complete", { method: "POST" });
      if (!response.ok) throw new Error("Recovery completion could not be verified.");
      router.replace("/portal/recovery-code");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("A new passkey could not be enrolled.")));
      return;
    }
    setAction("idle");
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Mandatory passkey re-enrollment">
      <p className="text-base text-zinc-700">
        {t("Recovery is not complete yet. Enroll at least one new passkey before receiving a fresh recovery code.")}
      </p>
      <button
        type="button"
        onClick={enroll}
        disabled={action === "working"}
        className="rounded-md bg-zinc-950 px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {action === "working" ? t("Waiting for passkey…") : t("Enroll a new passkey")}
      </button>
      {action === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}

export function PortalLogout() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [action, setAction] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  async function logout() {
    setAction("working");
    setMessage("");
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
      router.replace("/portal/login");
    } catch (error) {
      setAction("error");
      setMessage(errorMessage(error, t("The Portal session could not be cleared.")));
      return;
    }
    setAction("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={logout}
        disabled={action === "working"}
        className="rounded-md border border-zinc-950 px-4 py-3 text-base font-semibold text-zinc-950 disabled:opacity-60"
      >
        {action === "working" ? t("Logging out…") : t("Log out")}
      </button>
      {action === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

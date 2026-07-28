"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { usePortalLocale } from "./portal-locale-provider";
import { EmailPasswordLoginControls } from "./portal-auth-controls";

type SetupState = "idle" | "sending" | "sent";

export function EmailAccessControls() {
  const { t } = usePortalLocale();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setupState, setSetupState] = useState<SetupState>("idle");

  async function sendSetupLink() {
    setSetupState("sending");
    try {
      const redirectTo = new URL("/auth/callback?next=/portal/reset-password", window.location.origin).toString();
      await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
    } finally {
      // The response deliberately stays the same for unknown and non-Editor emails.
      setSetupState("sent");
    }
  }

  if (showPassword) {
    return <EmailPasswordLoginControls email={email} showEmail={false} />;
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6" aria-label="Email access">
      <p className="text-sm text-muted">{t("Enter your email to set up Portal access or use an existing password.")}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink" htmlFor="portal-access-email">
        {t("Email")}
        <input id="portal-access-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="rounded border border-line bg-surface px-3 py-2 text-ink" required />
      </label>
      <button type="button" onClick={sendSetupLink} disabled={!email || setupState === "sending"} className="rounded bg-zinc-950 px-4 py-3 text-base font-semibold text-white transition-transform active:scale-[0.96] disabled:opacity-60">
        {setupState === "sending" ? t("Sending…") : t("Set up or reset password")}
      </button>
      <button type="button" onClick={() => setShowPassword(true)} disabled={!email} className="min-h-10 px-1 text-sm font-semibold text-gold underline underline-offset-4 disabled:opacity-60">
        {t("I already have a password")}
      </button>
      {setupState === "sent" ? <p role="status" className="text-sm text-muted">{t("If this email belongs to an Editor account, a secure password link has been sent." )}</p> : null}
    </section>
  );
}

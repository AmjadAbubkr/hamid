import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from "./recovery-code";

export const RECOVERY_ENROLLMENT_COOKIE = "portal_recovery_enrollment";
export const RECOVERY_ENROLLMENT_TTL_SECONDS = 10 * 60;

type RecoveryCodeRow = {
  id: string;
  editor_id: string;
  code_hash: string;
};

type RecoveryEnrollmentSession = {
  id: string;
  auth_user_id: string;
  token_hash: string;
  expires_at: string;
  completed_at: string | null;
};

export function createRecoveryEnrollmentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRecoveryEnrollmentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function redeemRecoveryCode({
  code,
  admin,
}: {
  code: string;
  admin: SupabaseClient;
}): Promise<{ authUserId: string; enrollmentToken: string; expiresAt: Date } | null> {
  const { data, error } = await admin
    .from("recovery_codes")
    .select("id, editor_id, code_hash")
    .is("used_at", null);
  if (error) throw error;

  const candidates = (data ?? []) as RecoveryCodeRow[];
  for (const candidate of candidates) {
    if (!(await verifyRecoveryCode(code, candidate.code_hash))) continue;

    const { data: consumed, error: consumeError } = await admin
      .from("recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", candidate.id)
      .is("used_at", null)
      .select("editor_id")
      .maybeSingle();
    if (consumeError) throw consumeError;
    if (!consumed) return null;

    const { data: editor, error: editorError } = await admin
      .from("editors")
      .select("auth_user_id")
      .eq("id", candidate.editor_id)
      .maybeSingle();
    if (editorError) throw editorError;
    if (!editor?.auth_user_id) return null;

    const authUserId = editor.auth_user_id as string;
    const enrollmentToken = createRecoveryEnrollmentToken();
    const expiresAt = new Date(Date.now() + RECOVERY_ENROLLMENT_TTL_SECONDS * 1000);

    const { error: closeError } = await admin
      .from("recovery_enrollment_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("auth_user_id", authUserId)
      .is("completed_at", null);
    if (closeError) throw closeError;

    const { error: sessionError } = await admin.from("recovery_enrollment_sessions").insert({
      auth_user_id: authUserId,
      token_hash: hashRecoveryEnrollmentToken(enrollmentToken),
      expires_at: expiresAt.toISOString(),
    });
    if (sessionError) throw sessionError;

    return { authUserId, enrollmentToken, expiresAt };
  }

  return null;
}

export async function createRecoveryMagicLink({
  enrollmentToken,
  admin,
  siteUrl,
}: {
  enrollmentToken: string;
  admin: SupabaseClient;
  siteUrl: string;
}): Promise<string | null> {
  const session = await findActiveRecoveryEnrollment({ enrollmentToken, admin });
  if (!session) return null;

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(session.auth_user_id);
  if (userError) throw userError;
  if (!userResult.user?.email) return null;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userResult.user.email,
    options: {
      redirectTo: new URL("/auth/callback?next=/portal/re-enroll", siteUrl).toString(),
    },
  });
  if (error) throw error;

  return data.properties.action_link;
}

export async function hasActiveRecoveryEnrollment({
  authUserId,
  enrollmentToken,
  client,
}: {
  authUserId: string;
  enrollmentToken: string | undefined;
  client: SupabaseClient;
}): Promise<boolean> {
  if (!enrollmentToken) return false;

  const { data, error } = await client
    .from("recovery_enrollment_sessions")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("token_hash", hashRecoveryEnrollmentToken(enrollmentToken))
    .is("completed_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (error) throw error;

  return Boolean(data?.length);
}

export async function completeRecoveryEnrollment({
  authUserId,
  enrollmentToken,
  admin,
}: {
  authUserId: string;
  enrollmentToken: string | undefined;
  admin: SupabaseClient;
}): Promise<boolean> {
  if (!enrollmentToken) return false;

  const session = await findActiveRecoveryEnrollment({ enrollmentToken, admin });
  if (!session || session.auth_user_id !== authUserId) return false;

  const { data: passkeys, error: passkeyError } = await admin.auth.admin.passkey.listPasskeys({
    userId: authUserId,
  });
  if (passkeyError) throw passkeyError;
  if (!passkeys.length) return false;

  const { data, error } = await admin
    .from("recovery_enrollment_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", session.id)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  return Boolean(data);
}

export async function issueRecoveryCode({
  authUserId,
  admin,
}: {
  authUserId: string;
  admin: SupabaseClient;
}): Promise<string | null> {
  const { data: passkeys, error: passkeyError } = await admin.auth.admin.passkey.listPasskeys({
    userId: authUserId,
  });
  if (passkeyError) throw passkeyError;
  if (!passkeys.length) return null;

  const { data: editor, error: editorError } = await admin
    .from("editors")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (editorError) throw editorError;
  if (!editor) return null;

  const { data: existing, error: existingError } = await admin
    .from("recovery_codes")
    .select("id")
    .eq("editor_id", editor.id)
    .is("used_at", null)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return null;

  const code = generateRecoveryCode();
  const codeHash = await hashRecoveryCode(code);
  const { error: insertError } = await admin.from("recovery_codes").insert({
    editor_id: editor.id,
    code_hash: codeHash,
  });
  if (insertError) throw insertError;

  return code;
}

async function findActiveRecoveryEnrollment({
  enrollmentToken,
  admin,
}: {
  enrollmentToken: string;
  admin: SupabaseClient;
}): Promise<RecoveryEnrollmentSession | null> {
  const { data, error } = await admin
    .from("recovery_enrollment_sessions")
    .select("id, auth_user_id, token_hash, expires_at, completed_at")
    .eq("token_hash", hashRecoveryEnrollmentToken(enrollmentToken))
    .is("completed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;

  return (data as RecoveryEnrollmentSession | null) ?? null;
}

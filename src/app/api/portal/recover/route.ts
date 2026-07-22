import { NextResponse, type NextRequest } from "next/server";
import { RECOVERY_ENROLLMENT_COOKIE, RECOVERY_ENROLLMENT_TTL_SECONDS, redeemRecoveryCode } from "@/lib/portal-auth/recovery-service";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  const code = payload && typeof payload === "object" && "code" in payload ? (payload as { code?: unknown }).code : "";

  try {
    const redemption = await redeemRecoveryCode({
      code: typeof code === "string" ? code : "",
      admin: getSupabaseAdminClient(),
    });
    if (!redemption) return recoveryFailure();

    const response = NextResponse.json(
      { redirectTo: "/api/portal/recovery-bridge" },
      { headers: { "cache-control": "no-store" } },
    );
    response.cookies.set(RECOVERY_ENROLLMENT_COOKIE, redemption.enrollmentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: RECOVERY_ENROLLMENT_TTL_SECONDS,
    });
    return response;
  } catch {
    return recoveryFailure();
  }
}

function recoveryFailure() {
  return NextResponse.json(
    { error: "We could not continue the recovery process." },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
}

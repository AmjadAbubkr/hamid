import { NextResponse, type NextRequest } from "next/server";
import { RECOVERY_ENROLLMENT_COOKIE, createRecoveryMagicLink } from "@/lib/portal-auth/recovery-service";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const enrollmentToken = request.cookies.get(RECOVERY_ENROLLMENT_COOKIE)?.value;
  if (!enrollmentToken) return NextResponse.redirect(new URL("/portal/recover", request.url));

  try {
    const magicLink = await createRecoveryMagicLink({
      enrollmentToken,
      admin: getSupabaseAdminClient(),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin,
    });
    if (!magicLink) return NextResponse.redirect(new URL("/portal/recover", request.url));

    const response = NextResponse.redirect(magicLink, { status: 303 });
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/portal/recover", request.url));
  }
}

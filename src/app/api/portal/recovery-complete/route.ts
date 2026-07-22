import { NextResponse, type NextRequest } from "next/server";
import { RECOVERY_ENROLLMENT_COOKIE, completeRecoveryEnrollment } from "@/lib/portal-auth/recovery-service";
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(response, { error: "Unauthorized" }, 401);

  try {
    const completed = await completeRecoveryEnrollment({
      authUserId: user.id,
      enrollmentToken: request.cookies.get(RECOVERY_ENROLLMENT_COOKIE)?.value,
      admin: getSupabaseAdminClient(),
    });
    if (!completed) return jsonWithSessionCookies(response, { error: "Recovery enrollment is not complete." }, 409);

    response.cookies.set(RECOVERY_ENROLLMENT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return jsonWithSessionCookies(response, { error: "Recovery enrollment is not complete." }, 409);
  }
}

function jsonWithSessionCookies(response: NextResponse, body: { error: string }, status: number) {
  const json = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
  return json;
}

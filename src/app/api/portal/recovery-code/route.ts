import { NextResponse, type NextRequest } from "next/server";
import { issueRecoveryCode } from "@/lib/portal-auth/recovery-service";
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({}, { headers: { "cache-control": "no-store" } });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(response, { error: "Unauthorized" }, 401);

  try {
    const code = await issueRecoveryCode({ authUserId: user.id, admin: getSupabaseAdminClient() });
    if (!code) return jsonWithSessionCookies(response, { error: "Recovery code unavailable." }, 409);

    const json = NextResponse.json({ code }, { headers: { "cache-control": "no-store" } });
    for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
    return json;
  } catch {
    return jsonWithSessionCookies(response, { error: "Recovery code unavailable." }, 409);
  }
}

function jsonWithSessionCookies(response: NextResponse, body: { error: string }, status: number) {
  const json = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
  return json;
}

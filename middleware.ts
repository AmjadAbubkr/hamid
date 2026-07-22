import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

const PUBLIC_PORTAL_PATHS = new Set(["/portal/login", "/portal/recover"]);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies) {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      }
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isEditor = user ? Boolean(await getCurrentEditorId(supabase)) : false;
  const isPublicPortalPath = PUBLIC_PORTAL_PATHS.has(request.nextUrl.pathname);

  if (!isEditor && !isPublicPortalPath) {
    const login = new URL("/portal/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (isEditor && request.nextUrl.pathname === "/portal/login") {
    const redirect = NextResponse.redirect(new URL("/portal", request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};

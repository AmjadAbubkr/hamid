import { cookies } from "next/headers";
import { hasActiveRecoveryEnrollment, RECOVERY_ENROLLMENT_COOKIE } from "@/lib/portal-auth/recovery-service";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export async function getPortalAccess() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAuthenticated: false, recoveryActive: false };

  if (!(await getCurrentEditorId(supabase))) {
    return { isAuthenticated: false, recoveryActive: false };
  }

  return {
    isAuthenticated: true,
    recoveryActive: await hasActiveRecoveryEnrollment({
      authUserId: user.id,
      enrollmentToken: cookieStore.get(RECOVERY_ENROLLMENT_COOKIE)?.value,
      client: supabase,
    }),
  };
}

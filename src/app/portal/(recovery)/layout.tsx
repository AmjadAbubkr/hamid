import { redirect } from "next/navigation";
import { getPortalAccess } from "@/app/portal/portal-access";

export default async function RecoveryPortalLayout({ children }: { children: React.ReactNode }) {
  const access = await getPortalAccess();
  if (!access.isAuthenticated) redirect("/portal/login");
  if (!access.recoveryActive) redirect("/portal");
  return children;
}

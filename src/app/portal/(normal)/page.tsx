import { PasskeyEnrollment, PortalLogout } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalPage() {
  return (
    <PortalFrame title="Logged in as Hamid / Editor">
      <p className="text-base text-zinc-700">Content Item management will appear here.</p>
      <PasskeyEnrollment />
      <PortalLogout />
    </PortalFrame>
  );
}

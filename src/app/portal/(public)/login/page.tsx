import { PasskeyLoginControls } from "@/components/portal/portal-auth-controls";
import { EmailAccessControls } from "@/components/portal/email-access-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalLoginPage() {
  return (
    <PortalFrame title="Portal sign-in">
      <PasskeyLoginControls />
      <EmailAccessControls />
    </PortalFrame>
  );
}

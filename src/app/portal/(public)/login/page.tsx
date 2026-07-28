import { EmailPasswordLoginControls, PasskeyLoginControls } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalLoginPage() {
  return (
    <PortalFrame title="Portal sign-in">
      <PasskeyLoginControls />
      <EmailPasswordLoginControls />
    </PortalFrame>
  );
}

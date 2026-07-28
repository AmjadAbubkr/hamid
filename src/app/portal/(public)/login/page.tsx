import { DevelopmentPasswordLoginControls, PasskeyLoginControls } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalLoginPage() {
  return (
    <PortalFrame title="Portal sign-in">
      <PasskeyLoginControls />
      {process.env.NODE_ENV === "development" ? <DevelopmentPasswordLoginControls /> : null}
    </PortalFrame>
  );
}

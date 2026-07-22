import { RecoveryCodeDisplay } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalRecoveryCodePage() {
  return (
    <PortalFrame title="Store your recovery code">
      <RecoveryCodeDisplay />
    </PortalFrame>
  );
}

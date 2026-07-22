import { RecoveryCodeForm } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalRecoverPage() {
  return (
    <PortalFrame title="Recover Portal access">
      <RecoveryCodeForm />
    </PortalFrame>
  );
}

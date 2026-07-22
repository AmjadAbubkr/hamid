import { PasskeyReEnrollment } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalReEnrollPage() {
  return (
    <PortalFrame title="Enroll a replacement passkey">
      <PasskeyReEnrollment />
    </PortalFrame>
  );
}

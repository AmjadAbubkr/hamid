import { PasswordResetRequestForm } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalPasswordResetPage() {
  return <PortalFrame title="Reset Portal password"><PasswordResetRequestForm /></PortalFrame>;
}

import { PasswordUpdateForm } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalResetPasswordPage() {
  return <PortalFrame title="Set a new Portal password"><PasswordUpdateForm /></PortalFrame>;
}

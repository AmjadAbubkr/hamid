import Link from "next/link";
import { PasskeyEnrollment, PortalLogout } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PortalPage() {
  return (
    <PortalFrame title="Logged in as Hamid / Editor">
      <p className="text-base text-zinc-700">Manage the Content Items shown on the Profile.</p>
      <Link href="/portal/positions" className="w-fit font-semibold text-zinc-950 underline underline-offset-4">
        Manage Positions Held
      </Link>
      <Link href="/portal/education" className="w-fit font-semibold text-zinc-950 underline underline-offset-4">
        Manage Education Entries
      </Link>
      <PasskeyEnrollment />
      <PortalLogout />
    </PortalFrame>
  );
}

import Link from "next/link";
import { PositionForm } from "@/components/portal/position-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewPositionPage() {
  return (
    <PortalFrame title="New Position Held">
      <Link href="/portal/positions" className="w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4">
        Back to Positions Held
      </Link>
      <PositionForm />
    </PortalFrame>
  );
}

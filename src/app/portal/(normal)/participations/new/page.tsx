import Link from "next/link";
import { ParticipationForm } from "@/components/portal/participation-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewParticipationPage() {
  return (
    <PortalFrame title="New Past Participation">
      <Link href="/portal/participations" className="w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4">
        Back to Past Participations
      </Link>
      <ParticipationForm />
    </PortalFrame>
  );
}

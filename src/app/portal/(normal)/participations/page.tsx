import Link from "next/link";
import { ParticipationList } from "@/components/portal/participation-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function ParticipationsPage() {
  return (
    <PortalFrame title="Past Participations">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700">Create, edit, and publish historical appearances and events.</p>
        <Link href="/portal/participations/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          New Past Participation
        </Link>
      </div>
      <ParticipationList />
    </PortalFrame>
  );
}

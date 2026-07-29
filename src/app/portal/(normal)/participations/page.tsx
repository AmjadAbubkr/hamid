import Link from "next/link";
import { ParticipationList } from "@/components/portal/participation-list";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";

export default function ParticipationsPage() {
  return (
    <PortalFrame title="Past Participations">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700"><PortalText>Create, edit, and publish historical appearances and events.</PortalText></p>
        <Link href="/portal/participations/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          <PortalText>New Past Participation</PortalText>
        </Link>
      </div>
      <ParticipationList />
    </PortalFrame>
  );
}

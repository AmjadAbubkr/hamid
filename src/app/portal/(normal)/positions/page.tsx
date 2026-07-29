import Link from "next/link";
import { PositionList } from "@/components/portal/position-list";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";

export default function PositionsPage() {
  return (
    <PortalFrame title="Positions Held">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700"><PortalText>Create, edit, and publish career appointments.</PortalText></p>
        <Link
          href="/portal/positions/new"
          className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white"
        >
          <PortalText>New Position Held</PortalText>
        </Link>
      </div>
      <PositionList />
    </PortalFrame>
  );
}

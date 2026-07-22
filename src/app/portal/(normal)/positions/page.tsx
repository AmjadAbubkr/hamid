import Link from "next/link";
import { PositionList } from "@/components/portal/position-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function PositionsPage() {
  return (
    <PortalFrame title="Positions Held">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700">Create, edit, and publish career appointments.</p>
        <Link
          href="/portal/positions/new"
          className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white"
        >
          New Position Held
        </Link>
      </div>
      <PositionList />
    </PortalFrame>
  );
}

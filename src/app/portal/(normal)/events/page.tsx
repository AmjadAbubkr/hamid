import Link from "next/link";
import { EventList } from "@/components/portal/event-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function EventsPage() {
  return (
    <PortalFrame title="Upcoming Events">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700">Create, publish, and update events before they are archived.</p>
        <Link href="/portal/events/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          New Upcoming Event
        </Link>
      </div>
      <EventList />
    </PortalFrame>
  );
}

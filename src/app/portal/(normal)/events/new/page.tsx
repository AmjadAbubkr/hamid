import Link from "next/link";
import { EventForm } from "@/components/portal/event-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewEventPage() {
  return (
    <PortalFrame title="New Upcoming Event">
      <Link href="/portal/events" className="w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4">
        Back to Upcoming Events
      </Link>
      <EventForm />
    </PortalFrame>
  );
}

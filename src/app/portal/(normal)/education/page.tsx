import Link from "next/link";
import { EducationList } from "@/components/portal/education-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function EducationPage() {
  return (
    <PortalFrame title="Education Entries">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700">Create, edit, and publish qualifications and programmes.</p>
        <Link href="/portal/education/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          New Education Entry
        </Link>
      </div>
      <EducationList />
    </PortalFrame>
  );
}

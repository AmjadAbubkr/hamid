import Link from "next/link";
import { EducationList } from "@/components/portal/education-list";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";

export default function EducationPage() {
  return (
    <PortalFrame title="Education Entries">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700"><PortalText>Create, edit, and publish qualifications and programmes.</PortalText></p>
        <Link href="/portal/education/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          <PortalText>New Education Entry</PortalText>
        </Link>
      </div>
      <EducationList />
    </PortalFrame>
  );
}

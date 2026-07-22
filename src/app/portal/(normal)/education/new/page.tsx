import Link from "next/link";
import { EducationForm } from "@/components/portal/education-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewEducationPage() {
  return (
    <PortalFrame title="New Education Entry">
      <Link href="/portal/education" className="w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4">
        Back to Education Entries
      </Link>
      <EducationForm />
    </PortalFrame>
  );
}

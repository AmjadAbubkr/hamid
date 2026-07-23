import Link from "next/link";
import { GalleryList } from "@/components/portal/gallery-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function GalleryPage() {
  return (
    <PortalFrame title="Gallery Photos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#44474d]">Create, publish, replace, or return Gallery Photos to draft.</p>
        <Link href="/portal/gallery/new" className="rounded bg-[#04162e] px-4 py-2 font-semibold text-white">
          New Gallery Photo
        </Link>
      </div>
      <GalleryList />
    </PortalFrame>
  );
}

import Link from "next/link";
import { GalleryList } from "@/components/portal/gallery-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function GalleryPage() {
  return (
    <PortalFrame title="Gallery Photos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-700">Create, publish, replace, or return Gallery Photos to draft.</p>
        <Link href="/portal/gallery/new" className="rounded bg-gold px-4 py-2 font-semibold text-navy">
          New Gallery Photo
        </Link>
      </div>
      <GalleryList />
    </PortalFrame>
  );
}

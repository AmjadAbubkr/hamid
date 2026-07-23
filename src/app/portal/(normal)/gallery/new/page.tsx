import Link from "next/link";
import { GalleryForm } from "@/components/portal/gallery-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewGalleryPhotoPage() {
  return (
    <PortalFrame title="New Gallery Photo">
      <Link href="/portal/gallery" className="w-fit text-sm font-semibold text-[#04162e] underline decoration-[#7b5800] underline-offset-4">
        Back to Gallery Photos
      </Link>
      <GalleryForm />
    </PortalFrame>
  );
}

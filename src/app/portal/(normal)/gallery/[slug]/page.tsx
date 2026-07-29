import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GalleryForm, type GalleryPhoto } from "@/components/portal/gallery-form";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditGalleryPhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const editorId = await getCurrentEditorId(supabase);
  if (!editorId) notFound();

  const { data, error } = await supabase
    .from("gallery_photo")
    .select("id, slug, status, storage_path, caption_ar, caption_fr, caption_en, taken_date, photographer_credit_ar, photographer_credit_fr, photographer_credit_en, category_ar, category_fr, category_en")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Edit Gallery Photo">
      <Link href="/portal/gallery" className="w-fit text-sm font-semibold text-ink underline decoration-gold underline-offset-4">
        Back to Gallery Photos
      </Link>
      <GalleryForm photo={data as GalleryPhoto} />
    </PortalFrame>
  );
}

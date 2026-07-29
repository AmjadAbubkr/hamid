import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PositionForm, type PositionHeld } from "@/components/portal/position-form";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditPositionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const editorId = await getCurrentEditorId(supabase);
  if (!editorId) notFound();

  const { data, error } = await supabase
    .from("position_held")
    .select("id, slug, status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, institution, start_date, end_date, location, published_at")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Edit Position Held">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/portal/positions" className="text-zinc-950 underline underline-offset-4">
          Back to Positions Held
        </Link>
        <Link href={`/portal/positions/${data.slug}/preview`} className="text-zinc-950 underline underline-offset-4">
          Preview
        </Link>
      </div>
      <PositionForm position={data as PositionHeld} />
    </PortalFrame>
  );
}

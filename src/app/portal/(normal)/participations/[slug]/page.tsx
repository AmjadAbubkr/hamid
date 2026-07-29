import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ParticipationForm, type PastParticipation } from "@/components/portal/participation-form";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditParticipationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const editorId = await getCurrentEditorId(supabase);
  if (!editorId) notFound();

  const { data, error } = await supabase
    .from("past_participation")
    .select("id, slug, status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, venue_ar, venue_fr, venue_en, institution_ar, institution_fr, institution_en, role, role_other_ar, role_other_fr, role_other_en, source_url, event_date, event_end_date, event_date_label, image_path")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Edit Past Participation">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/portal/participations" className="text-zinc-950 underline underline-offset-4"><PortalText>Back to Past Participations</PortalText></Link>
        <Link href={`/portal/participations/${data.slug}/preview`} className="text-zinc-950 underline underline-offset-4"><PortalText>Preview</PortalText></Link>
      </div>
      <ParticipationForm participation={data as PastParticipation} />
    </PortalFrame>
  );
}

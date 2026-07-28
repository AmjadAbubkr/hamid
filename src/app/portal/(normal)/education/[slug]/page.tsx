import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EducationForm, type EducationEntry } from "@/components/portal/education-form";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditEducationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const editorId = await getCurrentEditorId(supabase);
  if (!editorId) notFound();

  const { data, error } = await supabase
    .from("education_entry")
    .select("id, slug, status, degree_ar, degree_fr, degree_en, institution_ar, institution_fr, institution_en, honours_ar, honours_fr, honours_en, start_date, end_date, location, published_at")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Edit Education Entry">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/portal/education" className="text-zinc-950 underline underline-offset-4">
          Back to Education Entries
        </Link>
        <Link href={`/portal/education/${data.slug}/preview`} className="text-zinc-950 underline underline-offset-4">
          Preview
        </Link>
      </div>
      <EducationForm education={data as EducationEntry} />
    </PortalFrame>
  );
}

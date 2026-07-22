import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipationPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  unstable_noStore();
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
    .select("slug, status, title_ar, title_fr, body_ar, body_fr, venue_ar, venue_fr, institution_ar, institution_fr, role, role_other_ar, role_other_fr, source_url, event_date_label")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Past Participation preview">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={`/portal/participations/${data.slug}`} className="text-zinc-950 underline underline-offset-4">Back to edit</Link>
        <p className="text-zinc-700">Draft preview - not visible on the Profile.</p>
      </div>
      <section className="flex flex-col gap-6 rounded-lg border border-zinc-300 bg-white p-5">
        <p className="font-medium capitalize text-zinc-700">{data.status}</p>
        <p className="text-zinc-700">{data.event_date_label || "Event date not set"}</p>
        <LocalePreview direction="rtl" title={data.title_ar} body={data.body_ar} venue={data.venue_ar} institution={data.institution_ar} locale="Arabic" />
        <LocalePreview direction="ltr" title={data.title_fr} body={data.body_fr} venue={data.venue_fr} institution={data.institution_fr} locale="French" />
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail term="Role" value={data.role === "Other" ? data.role_other_fr || data.role_other_ar : data.role} />
          <Detail term="Source URL" value={data.source_url} isUrl />
        </dl>
      </section>
    </PortalFrame>
  );
}

function LocalePreview({
  direction,
  title,
  body,
  venue,
  institution,
  locale,
}: {
  direction: "rtl" | "ltr";
  title: string | null;
  body: string | null;
  venue: string | null;
  institution: string | null;
  locale: string;
}) {
  return (
    <section dir={direction} className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-600">{locale}</p>
      <h2 className="text-2xl font-semibold text-zinc-950">{title || `${locale} title not set`}</h2>
      {body ? <p className="whitespace-pre-wrap text-zinc-800">{body}</p> : null}
      <p className="text-zinc-800">{institution || `${locale} institution not set`}</p>
      <p className="text-zinc-700">{venue || `${locale} venue not set`}</p>
    </section>
  );
}

function Detail({ term, value, isUrl = false }: { term: string; value: string | null; isUrl?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-zinc-600">{term}</dt>
      <dd className="text-zinc-950">
        {value ? (isUrl ? <a href={value} className="underline underline-offset-4" rel="noreferrer">{value}</a> : value) : "Not set"}
      </dd>
    </div>
  );
}

import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PositionPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
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
    .from("position_held")
    .select("slug, status, title_ar, title_fr, body_ar, body_fr, institution, start_date, end_date, location")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Position Held preview">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={`/portal/positions/${data.slug}`} className="text-zinc-950 underline underline-offset-4">
          Back to edit
        </Link>
        <p className="text-zinc-700">Draft preview — not visible on the Profile.</p>
      </div>
      <section className="flex flex-col gap-6 rounded-lg border border-zinc-300 bg-white p-5">
        <p className="font-medium capitalize text-zinc-700">{data.status}</p>
        <div dir="rtl" className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-zinc-950">{data.title_ar || "Arabic title not set"}</h2>
          {data.body_ar ? <p className="whitespace-pre-wrap text-zinc-800">{data.body_ar}</p> : null}
        </div>
        <div dir="ltr" className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-zinc-950">{data.title_fr || "French title not set"}</h2>
          {data.body_fr ? <p className="whitespace-pre-wrap text-zinc-800">{data.body_fr}</p> : null}
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail term="Institution" value={data.institution} />
          <Detail term="Location" value={data.location} />
          <Detail term="Start date" value={data.start_date} />
          <Detail term="End date" value={data.end_date || "Present"} />
        </dl>
      </section>
    </PortalFrame>
  );
}

function Detail({ term, value }: { term: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-zinc-600">{term}</dt>
      <dd className="text-zinc-950">{value || "Not set"}</dd>
    </div>
  );
}

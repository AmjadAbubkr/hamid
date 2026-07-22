import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EducationPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
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
    .from("education_entry")
    .select("slug, status, degree_ar, degree_fr, institution_ar, institution_fr, honours_ar, honours_fr, start_date, end_date, location")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Education Entry preview">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={`/portal/education/${data.slug}`} className="text-zinc-950 underline underline-offset-4">
          Back to edit
        </Link>
        <p className="text-zinc-700">Draft preview - not visible on the Profile.</p>
      </div>
      <section className="flex flex-col gap-6 rounded-lg border border-zinc-300 bg-white p-5">
        <p className="font-medium capitalize text-zinc-700">{data.status}</p>
        <LocalePreview
          direction="rtl"
          degree={data.degree_ar}
          institution={data.institution_ar}
          honours={data.honours_ar}
          title="Arabic"
        />
        <LocalePreview
          direction="ltr"
          degree={data.degree_fr}
          institution={data.institution_fr}
          honours={data.honours_fr}
          title="French"
        />
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail term="Start date" value={data.start_date} />
          <Detail term="End date" value={data.end_date} />
          <Detail term="Location" value={data.location} />
        </dl>
      </section>
    </PortalFrame>
  );
}

function LocalePreview({
  direction,
  degree,
  institution,
  honours,
  title,
}: {
  direction: "rtl" | "ltr";
  degree: string | null;
  institution: string | null;
  honours: string | null;
  title: string;
}) {
  return (
    <section dir={direction} className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <h2 className="text-2xl font-semibold text-zinc-950">{degree || `${title} degree not set`}</h2>
      <p className="text-zinc-800">{institution || `${title} institution not set`}</p>
      {honours ? <p className="text-zinc-700">{honours}</p> : null}
    </section>
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

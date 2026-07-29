import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";
import { sanitizeArticleHtml } from "@/lib/articles/sanitize-article-html";
import { safeHttpUrl } from "@/lib/safe-http-url";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArticlePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
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
    .from("article")
    .select("slug, status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, published_in_url, published_in_name_ar, published_in_name_fr, published_in_name_en, published_date")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  const sourceUrl = safeHttpUrl(data.published_in_url);

  return (
    <PortalFrame title="Article preview">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={`/portal/articles/${data.slug}`} className="text-zinc-950 underline underline-offset-4"><PortalText>Back to edit</PortalText></Link>
        <p className="text-zinc-700">{data.status === "draft" ? "Draft preview - not visible on the Profile." : "Public Article preview."}</p>
      </div>
      <section className="flex flex-col gap-8 rounded-lg border border-zinc-300 bg-white p-5">
        <p className="font-medium capitalize text-zinc-700">{data.status}</p>
        <p className="text-zinc-700">{data.published_date || "Original publication date not set"}</p>
        <LocalePreview direction="rtl" title={data.title_ar} body={data.body_ar} publicationName={data.published_in_name_ar} sourceUrl={sourceUrl} locale="Arabic" />
        <LocalePreview direction="ltr" title={data.title_fr} body={data.body_fr} publicationName={data.published_in_name_fr} sourceUrl={sourceUrl} locale="French" />
      </section>
    </PortalFrame>
  );
}

function LocalePreview({
  direction,
  title,
  body,
  publicationName,
  sourceUrl,
  locale,
}: {
  direction: "rtl" | "ltr";
  title: string;
  body: string;
  publicationName: string | null;
  sourceUrl: string | null;
  locale: string;
}) {
  return (
    <section dir={direction} className="flex flex-col gap-3">
      <p className="text-sm font-medium text-zinc-600">{locale}</p>
      <h2 className="text-2xl font-semibold text-zinc-950">{title || `${locale} title not set`}</h2>
      {publicationName ? <p className="text-sm text-zinc-700">{sourceUrl ? <a className="underline underline-offset-4" href={sourceUrl} rel="noreferrer">{publicationName}</a> : publicationName}</p> : null}
      {body ? <div className="leading-8 text-zinc-800 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-xl [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ps-6" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(body) }} /> : <p className="text-zinc-700">{locale} body not set</p>}
    </section>
  );
}

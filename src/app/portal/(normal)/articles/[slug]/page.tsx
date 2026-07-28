import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArticleForm, type Article } from "@/components/portal/article-form";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createSupabaseServerClient, getCurrentEditorId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
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
    .select("id, slug, status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, published_in_url, published_in_name_ar, published_in_name_fr, published_in_name_en, published_date")
    .eq("slug", slug)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return (
    <PortalFrame title="Edit Article">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/portal/articles" className="text-zinc-950 underline underline-offset-4">Back to Articles</Link>
        <Link href={`/portal/articles/${data.slug}/preview`} className="text-zinc-950 underline underline-offset-4">Preview</Link>
      </div>
      <ArticleForm article={data as Article} />
    </PortalFrame>
  );
}

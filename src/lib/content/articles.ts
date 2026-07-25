import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type Article = {
  slug: string;
  titleAr: string;
  titleFr: string;
  titleEn: string | null;
  bodyAr: string;
  bodyFr: string;
  bodyEn: string | null;
  publishedInUrl: string | null;
  publishedInNameAr: string | null;
  publishedInNameFr: string | null;
  publishedInNameEn: string | null;
  publishedDate: string;
};

const ARTICLE_FIELDS =
  "slug,title_ar,title_fr,title_en,body_ar,body_fr,body_en,published_in_url,published_in_name_ar,published_in_name_fr,published_in_name_en,published_date";

type ArticleRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string | null;
  body_ar: string;
  body_fr: string;
  body_en: string | null;
  published_in_url: string | null;
  published_in_name_ar: string | null;
  published_in_name_fr: string | null;
  published_in_name_en: string | null;
  published_date: string;
};

function toArticle(row: ArticleRow): Article {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    bodyEn: row.body_en,
    publishedInUrl: row.published_in_url,
    publishedInNameAr: row.published_in_name_ar,
    publishedInNameFr: row.published_in_name_fr,
    publishedInNameEn: row.published_in_name_en,
    publishedDate: row.published_date,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedArticles(client?: SupabaseClient): Promise<Article[]> {
  const supabase = getClient(client);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("article")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .order("published_date", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as ArticleRow[]).map(toArticle);
}

export async function getPublishedArticleBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<Article | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("article")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toArticle(data as ArticleRow) : null;
}

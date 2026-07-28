import { NextResponse, type NextRequest } from "next/server";
import { sanitizeArticleHtml } from "@/lib/articles/sanitize-article-html";
import {
  createSupabaseServerClient,
  getCurrentEditorId,
  getSupabaseAdminClient,
} from "@/lib/supabase/server";

type ArticleRequest = {
  id?: unknown;
  slug?: unknown;
  title_ar?: unknown;
  title_fr?: unknown;
  title_en?: unknown;
  body_ar?: unknown;
  body_fr?: unknown;
  body_en?: unknown;
  published_in_url?: unknown;
  published_in_name_ar?: unknown;
  published_in_name_fr?: unknown;
  published_in_name_en?: unknown;
  published_date?: unknown;
  action?: unknown;
};

type SavedArticle = {
  id: string;
  slug: string;
  status: "draft" | "published";
};

export async function POST(request: NextRequest) {
  const response = NextResponse.json({}, { headers: { "cache-control": "no-store" } });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(response, { error: "Unauthorized" }, 401);

  let editorId: string | null;
  try {
    editorId = await getCurrentEditorId(supabase);
  } catch {
    return jsonWithSessionCookies(response, { error: "Editor access could not be verified." }, 403);
  }
  if (!editorId) return jsonWithSessionCookies(response, { error: "Editor access is required." }, 403);

  const payload = await request.json().catch(() => null) as ArticleRequest | null;
  if (!payload || typeof payload !== "object") {
    return jsonWithSessionCookies(response, { error: "A valid Article payload is required." }, 400);
  }

  let articleData: ReturnType<typeof articleFieldsFrom>;
  try {
    articleData = articleFieldsFrom(payload);
  } catch (error) {
    return jsonWithSessionCookies(response, { error: messageFor(error, "The Article payload is invalid.") }, 400);
  }

  try {
    const admin = getSupabaseAdminClient();
    const saved = await saveArticle({ admin, editorId, id: stringOrUndefined(payload.id), fields: articleData });
    if (!saved) return jsonWithSessionCookies(response, { error: "Article not found." }, 404);

    if (payload.action === "publish" && saved.status !== "published") {
      const { error } = await supabase.rpc("publish_content_item", {
        item_type: "article",
        item_id: saved.id,
      });
      if (error) return jsonWithSessionCookies(response, { error: error.message }, 422);

      return jsonWithSessionCookies(response, { article: { ...saved, status: "published" } }, 200);
    }

    return jsonWithSessionCookies(response, { article: saved }, payload.id ? 200 : 201);
  } catch (error) {
    return jsonWithSessionCookies(response, { error: messageFor(error, "The Article could not be saved.") }, 500);
  }
}

function articleFieldsFrom(payload: ArticleRequest) {
  const slug = requiredString(payload.slug, "A URL slug is required.").trim();
  const publishedInUrl = optionalHttpUrl(payload.published_in_url);

  return {
    slug,
    title_ar: stringOrEmpty(payload.title_ar),
    title_fr: stringOrEmpty(payload.title_fr),
    title_en: stringOrEmpty(payload.title_en),
    body_ar: sanitizeArticleHtml(stringOrEmpty(payload.body_ar)),
    body_fr: sanitizeArticleHtml(stringOrEmpty(payload.body_fr)),
    body_en: sanitizeArticleHtml(stringOrEmpty(payload.body_en)),
    published_in_url: publishedInUrl,
    published_in_name_ar: emptyToNull(payload.published_in_name_ar),
    published_in_name_fr: emptyToNull(payload.published_in_name_fr),
    published_in_name_en: emptyToNull(payload.published_in_name_en),
    published_date: emptyToNull(payload.published_date),
  };
}

async function saveArticle({
  admin,
  editorId,
  id,
  fields,
}: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  editorId: string;
  id?: string;
  fields: ReturnType<typeof articleFieldsFrom>;
}): Promise<SavedArticle | null> {
  if (id) {
    const { data, error } = await admin
      .from("article")
      .update(fields)
      .eq("id", id)
      .eq("author_editor_id", editorId)
      .select("id, slug, status")
      .maybeSingle();
    if (error) throw error;
    return data as SavedArticle | null;
  }

  const { data, error } = await admin
    .from("article")
    .insert({ ...fields, author_editor_id: editorId })
    .select("id, slug, status")
    .single();
  if (error) throw error;
  return data as SavedArticle;
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requiredString(value: unknown, error: string) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(error);
  return value;
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function emptyToNull(value: unknown) {
  const normalized = stringOrEmpty(value).trim();
  return normalized || null;
}

function optionalHttpUrl(value: unknown) {
  const normalized = emptyToNull(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    // Fall through to the useful validation error below.
  }

  throw new Error("The original publication URL must use HTTP or HTTPS.");
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function jsonWithSessionCookies(
  response: NextResponse,
  body: { error?: string; article?: SavedArticle },
  status: number,
) {
  const json = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
  return json;
}

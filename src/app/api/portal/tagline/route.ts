import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  getCurrentEditorId,
  getSupabaseAdminClient,
} from "@/lib/supabase/server";

type TaglineAction = "save" | "publish";

type Tagline = {
  id: string;
  status: "draft" | "published";
  tagline_ar: string;
  tagline_fr: string;
  tagline_en: string;
  author_editor_id: string | null;
};

class TaglineOwnershipError extends Error {}

export async function GET(request: NextRequest) {
  const context = await editorContext(request);
  if ("errorResponse" in context) return context.errorResponse;

  try {
    const tagline = await readTagline(context.admin, context.editorId);
    return jsonWithSessionCookies(context.response, { tagline }, 200);
  } catch (error) {
    return jsonWithSessionCookies(context.response, { error: messageFor(error, "The Tagline could not be loaded.") }, error instanceof TaglineOwnershipError ? 403 : 500);
  }
}

export async function POST(request: NextRequest) {
  const context = await editorContext(request);
  if ("errorResponse" in context) return context.errorResponse;

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return jsonWithSessionCookies(context.response, { error: "A valid Tagline payload is required." }, 400);

  let fields: ReturnType<typeof taglineFieldsFrom>;
  let action: TaglineAction;
  try {
    fields = taglineFieldsFrom(payload);
    action = taglineActionFrom(payload);
  } catch (error) {
    return jsonWithSessionCookies(context.response, { error: messageFor(error, "The Tagline payload is invalid.") }, 400);
  }

  let saved: Tagline;
  try {
    const tagline = await claimTagline(context.admin, context.editorId);
    const { data, error } = await context.admin
      .from("tagline")
      .update({ ...fields, status: "draft", published_at: null })
      .eq("id", tagline.id)
      .eq("author_editor_id", context.editorId)
      .select("id, status, tagline_ar, tagline_fr, tagline_en, author_editor_id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("The Tagline is not available to this Editor.");
    saved = data as Tagline;
  } catch (error) {
    return jsonWithSessionCookies(context.response, { error: messageFor(error, "The Tagline could not be saved.") }, error instanceof TaglineOwnershipError ? 403 : 500);
  }

  if (action === "publish") {
    const { error } = await context.supabase.rpc("publish_content_item", {
      item_type: "tagline",
      item_id: saved.id,
    });
    if (error) return jsonWithSessionCookies(context.response, { error: error.message }, 422);
    return jsonWithSessionCookies(context.response, { tagline: { ...saved, status: "published" } }, 200);
  }

  return jsonWithSessionCookies(context.response, { tagline: saved }, 200);
}

async function editorContext(request: NextRequest) {
  const response = NextResponse.json({}, { headers: { "cache-control": "no-store" } });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { errorResponse: jsonWithSessionCookies(response, { error: "Unauthorized" }, 401) };

  let editorId: string | null;
  try {
    editorId = await getCurrentEditorId(supabase);
  } catch {
    return { errorResponse: jsonWithSessionCookies(response, { error: "Editor access could not be verified." }, 403) };
  }
  if (!editorId) return { errorResponse: jsonWithSessionCookies(response, { error: "Editor access is required." }, 403) };

  try {
    return { response, supabase, editorId, admin: getSupabaseAdminClient() };
  } catch (error) {
    return { errorResponse: jsonWithSessionCookies(response, { error: messageFor(error, "The Tagline is unavailable.") }, 500) };
  }
}

async function claimTagline(admin: ReturnType<typeof getSupabaseAdminClient>, editorId: string): Promise<Tagline> {
  const current = await readTagline(admin, editorId);
  if (current.author_editor_id === editorId) return current;

  const { data: claimed, error: claimError } = await admin
    .from("tagline")
    .update({ author_editor_id: editorId })
    .eq("id", current.id)
    .is("author_editor_id", null)
    .select("id, status, tagline_ar, tagline_fr, tagline_en, author_editor_id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (claimed) return claimed as Tagline;

  const reread = await readTagline(admin, editorId);
  if (reread.author_editor_id === editorId) return reread;
  throw new TaglineOwnershipError("The Tagline belongs to a different Editor.");
}

async function readTagline(admin: ReturnType<typeof getSupabaseAdminClient>, editorId: string): Promise<Tagline> {
  const { data, error } = await admin
    .from("tagline")
    .select("id, status, tagline_ar, tagline_fr, tagline_en, author_editor_id")
    .eq("singleton_key", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The singleton Tagline seed is missing.");

  const current = data as Tagline;
  if (current.author_editor_id && current.author_editor_id !== editorId) {
    throw new TaglineOwnershipError("The Tagline belongs to a different Editor.");
  }
  return current;
}

function taglineFieldsFrom(payload: Record<string, unknown>) {
  return {
    tagline_ar: stringOrEmpty(payload.tagline_ar),
    tagline_fr: stringOrEmpty(payload.tagline_fr),
    tagline_en: stringOrEmpty(payload.tagline_en),
  };
}

function taglineActionFrom(payload: Record<string, unknown>): TaglineAction {
  if (payload.action === "save" || payload.action === "publish") return payload.action;
  throw new Error("Choose a valid Tagline action.");
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function jsonWithSessionCookies(
  response: NextResponse,
  body: { error?: string; tagline?: Tagline },
  status: number,
) {
  const json = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
  return json;
}

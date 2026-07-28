import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentEditorId, getSupabaseAdminClient } from "@/lib/supabase/server";

const TABLES = ["article", "position_held", "education_entry", "past_participation", "upcoming_event", "gallery_photo"] as const;
type ContentTable = typeof TABLES[number];

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({}, { headers: { "cache-control": "no-store" } });
  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json(response, { error: "Unauthorized" }, 401);
  const editorId = await getCurrentEditorId(supabase).catch(() => null);
  if (!editorId) return json(response, { error: "Editor access is required." }, 403);

  const payload = await request.json().catch(() => null) as { itemType?: unknown; id?: unknown } | null;
  if (!payload || !TABLES.includes(payload.itemType as ContentTable) || typeof payload.id !== "string") {
    return json(response, { error: "A valid Content Item is required." }, 400);
  }

  const admin = getSupabaseAdminClient();
  const table = payload.itemType as ContentTable;
  const imageColumn = table === "gallery_photo" ? "storage_path" : (table === "upcoming_event" || table === "past_participation" ? "image_path" : "id");
  const { data: existing, error: lookupError } = await admin.from(table).select(imageColumn).eq("id", payload.id).eq("author_editor_id", editorId).maybeSingle();
  if (lookupError) return json(response, { error: lookupError.message }, 500);
  if (!existing) return json(response, { error: "Content Item not found." }, 404);
  const { error } = await admin.from(table).delete().eq("id", payload.id).eq("author_editor_id", editorId);
  if (error) return json(response, { error: error.message }, 500);
  const path = (existing as { storage_path?: string | null; image_path?: string | null }).storage_path ?? (existing as { image_path?: string | null }).image_path;
  if (path) {
    const buckets = table === "gallery_photo" ? ["gallery-staging", "gallery-public"] : ["content-staging", "content-public"];
    await Promise.all(buckets.map((bucket) => admin.storage.from(bucket).remove([path])));
  }
  return json(response, { deleted: true });
}

function json(response: NextResponse, body: object, status = 200) {
  const output = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  response.cookies.getAll().forEach((cookie) => output.cookies.set(cookie));
  return output;
}

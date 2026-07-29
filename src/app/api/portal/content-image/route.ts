import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentEditorId, getSupabaseAdminClient } from "@/lib/supabase/server";

const TABLES = ["upcoming_event", "past_participation"] as const;
type Table = typeof TABLES[number];
const STAGING_BUCKET = "content-staging";
const PUBLIC_BUCKET = "content-public";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({}, { headers: { "cache-control": "no-store" } });
  const supabase = createSupabaseServerClient({ getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json(response, { error: "Unauthorized" }, 401);
  const editorId = await getCurrentEditorId(supabase).catch(() => null);
  if (!editorId) return json(response, { error: "Editor access is required." }, 403);

  const form = await request.formData().catch(() => null);
  const itemType = form?.get("itemType");
  const id = form?.get("id");
  const image = form?.get("image");
  if (!form || !TABLES.includes(itemType as Table) || typeof id !== "string" || !id || !image || typeof image === "string") return json(response, { error: "Choose an image for a saved event or participation." }, 400);
  if (image.size === 0 || image.size > 8 * 1024 * 1024) return json(response, { error: "Choose an image no larger than 8 MB." }, 400);
  const contentType = await imageType(image);
  if (!contentType || (image.type && image.type !== contentType)) return json(response, { error: "Choose a JPEG, PNG, or WebP image." }, 400);

  const table = itemType as Table;
  const admin = getSupabaseAdminClient();
  const { data: existing, error: findError } = await admin.from(table).select("id,status,image_path").eq("id", id).eq("author_editor_id", editorId).maybeSingle();
  if (findError) return json(response, { error: findError.message }, 500);
  if (!existing) return json(response, { error: "Content Item not found." }, 404);

  const bucket = existing.status === "published" ? PUBLIC_BUCKET : STAGING_BUCKET;
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  const path = `${editorId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from(bucket).upload(path, image, { contentType, upsert: false });
  if (uploadError) return json(response, { error: uploadError.message }, 500);
  if (existing.status !== "published") {
    const { error: publicUploadError } = await admin.storage.from(PUBLIC_BUCKET).upload(path, image, { contentType, upsert: false });
    if (publicUploadError) { await admin.storage.from(STAGING_BUCKET).remove([path]); return json(response, { error: publicUploadError.message }, 500); }
  }
  const { error: updateError } = await admin.from(table).update({ image_path: path }).eq("id", id).eq("author_editor_id", editorId);
  if (updateError) { await Promise.all([STAGING_BUCKET, PUBLIC_BUCKET].map((name) => admin.storage.from(name).remove([path]))); return json(response, { error: updateError.message }, 500); }
  if (existing.image_path) await Promise.all([STAGING_BUCKET, PUBLIC_BUCKET].map((name) => admin.storage.from(name).remove([existing.image_path!] )));
  return json(response, { image_path: path });
}

async function imageType(file: File): Promise<"image/jpeg" | "image/png" | "image/webp" | null> {
  const b = new Uint8Array(await file.arrayBuffer());
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

function json(response: NextResponse, body: object, status = 200) {
  const output = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  response.cookies.getAll().forEach((cookie) => output.cookies.set(cookie));
  return output;
}

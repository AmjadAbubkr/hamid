import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  getCurrentEditorId,
  getSupabaseAdminClient,
} from "@/lib/supabase/server";

const STAGING_BUCKET = "gallery-staging";
const PUBLIC_BUCKET = "gallery-public";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type GalleryAction = "save" | "publish" | "unpublish";

type GalleryPhoto = {
  id: string;
  slug: string;
  status: "draft" | "published";
  storage_path: string;
};

type ExistingPhoto = GalleryPhoto & { author_editor_id: string };

type ImageDetails = {
  path: string;
  file: File;
  contentType: "image/jpeg" | "image/png" | "image/webp";
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

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonWithSessionCookies(response, { error: "A valid Gallery Photo payload is required." }, 400);

  let fields: ReturnType<typeof galleryFieldsFrom>;
  let action: GalleryAction;
  let image: File | null;
  try {
    fields = galleryFieldsFrom(formData);
    action = galleryActionFrom(formData);
    image = imageFrom(formData);
    if (image) await validateImage(image);
  } catch (error) {
    return jsonWithSessionCookies(response, { error: messageFor(error, "The Gallery Photo payload is invalid.") }, 400);
  }

  const id = stringOrUndefined(formData.get("id"));
  let uploadedStagingPath: string | null = null;
  let copiedPublicPath: string | null = null;
  let unpublishBackupPath: string | null = null;
  let publicRemovedForUnpublish = false;
  let statePersisted = false;
  let admin: ReturnType<typeof getSupabaseAdminClient> | null = null;
  let existing: ExistingPhoto | null = null;
  try {
    admin = getSupabaseAdminClient();
    existing = id ? await findPhoto(admin, id, editorId) : null;
    if (id && !existing) return jsonWithSessionCookies(response, { error: "Gallery Photo not found." }, 404);
    if (!existing && !image) return jsonWithSessionCookies(response, { error: "Choose an image before saving this Gallery Photo." }, 400);
    if (action === "unpublish" && existing?.status !== "published") {
      return jsonWithSessionCookies(response, { error: "Only a published Gallery Photo can move back to draft." }, 422);
    }

    let storagePath = existing?.storage_path ?? "";
    if (image) {
      const details = await imageDetails(editorId, image);
      storagePath = details.path;
      await uploadToStaging(admin, details);
      uploadedStagingPath = details.path;
    }

    const needsPublicCopy = (action === "publish" && existing?.status !== "published")
      || (action !== "unpublish" && existing?.status === "published" && Boolean(image));
    if (needsPublicCopy) {
      await copyObject(admin, STAGING_BUCKET, PUBLIC_BUCKET, storagePath);
      copiedPublicPath = storagePath;
    }
    if (action === "unpublish") {
      // There is no cross-bucket move in Storage. Keep a private restore copy
      // until the database row is safely a Draft, then remove the public object
      // before changing status so a Draft can never retain a public image.
      await copyObject(admin, PUBLIC_BUCKET, STAGING_BUCKET, existing!.storage_path, true);
      unpublishBackupPath = existing!.storage_path;
      await removeObject(admin, PUBLIC_BUCKET, existing!.storage_path);
      publicRemovedForUnpublish = true;
    }

    const saved = await savePhoto({
      admin,
      editorId,
      existing,
      fields,
      storagePath,
      status: action === "unpublish" ? "draft" : existing?.status,
    });
    statePersisted = true;

    if (action === "publish" && saved.status !== "published") {
      const { error } = await supabase.rpc("publish_content_item", {
        item_type: "gallery_photo",
        item_id: saved.id,
      });
      if (error) throw error;
      saved.status = "published";
    }

    if (saved.status === "published") {
      await safelyRemove(admin, STAGING_BUCKET, storagePath);
    }
    if (existing && image && existing.storage_path !== storagePath) {
      await safelyRemove(admin, existing.status === "published" ? PUBLIC_BUCKET : STAGING_BUCKET, existing.storage_path);
    }
    if (unpublishBackupPath && unpublishBackupPath !== storagePath) {
      await safelyRemove(admin, STAGING_BUCKET, unpublishBackupPath);
    }

    return jsonWithSessionCookies(response, { photo: saved }, id ? 200 : 201);
  } catch (error) {
    let publicRestored = false;
    if (admin && publicRemovedForUnpublish && unpublishBackupPath) {
      try {
        await copyObject(admin, STAGING_BUCKET, PUBLIC_BUCKET, unpublishBackupPath, true);
        publicRestored = true;
      } catch {
        // Preserve the private backup below: it is the only safe recovery copy.
      }
    }
    if (admin && copiedPublicPath) await safelyRemove(admin, PUBLIC_BUCKET, copiedPublicPath);
    if (admin && !statePersisted && uploadedStagingPath) await safelyRemove(admin, STAGING_BUCKET, uploadedStagingPath);
    if (admin && !statePersisted && unpublishBackupPath && publicRestored) {
      await safelyRemove(admin, STAGING_BUCKET, unpublishBackupPath);
    }
    return jsonWithSessionCookies(response, { error: messageFor(error, "The Gallery Photo could not be saved.") }, 500);
  }
}

function galleryFieldsFrom(formData: FormData) {
  const slug = requiredString(formData.get("slug"), "A URL slug is required.").trim();
  return {
    slug,
    caption_ar: stringOrEmpty(formData.get("caption_ar")),
    caption_fr: stringOrEmpty(formData.get("caption_fr")),
    caption_en: stringOrEmpty(formData.get("caption_en")),
    taken_date: emptyToNull(formData.get("taken_date")),
    photographer_credit_ar: emptyToNull(formData.get("photographer_credit_ar")),
    photographer_credit_fr: emptyToNull(formData.get("photographer_credit_fr")),
    photographer_credit_en: emptyToNull(formData.get("photographer_credit_en")),
    category_ar: emptyToNull(formData.get("category_ar")),
    category_fr: emptyToNull(formData.get("category_fr")),
    category_en: emptyToNull(formData.get("category_en")),
  };
}

function galleryActionFrom(formData: FormData): GalleryAction {
  const action = stringOrEmpty(formData.get("action"));
  if (action === "save" || action === "publish" || action === "unpublish") return action;
  throw new Error("Choose a valid Gallery Photo action.");
}

function imageFrom(formData: FormData): File | null {
  const entry = formData.get("image");
  return entry && typeof entry !== "string" ? entry : null;
}

async function validateImage(file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Choose an image no larger than 8 MB.");
  if (file.size === 0) throw new Error("The image file is empty.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = imageContentTypeFrom(bytes);
  if (!contentType) throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.type && file.type !== contentType) throw new Error("The image file type does not match its contents.");
}

async function imageDetails(editorId: string, file: File): Promise<ImageDetails> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = imageContentTypeFrom(bytes);
  if (!contentType) throw new Error("Choose a JPEG, PNG, or WebP image.");
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  return {
    path: `${editorId}/${crypto.randomUUID()}.${extension}`,
    file,
    contentType,
  };
}

function imageContentTypeFrom(bytes: Uint8Array): ImageDetails["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

async function findPhoto(admin: ReturnType<typeof getSupabaseAdminClient>, id: string, editorId: string): Promise<ExistingPhoto | null> {
  const { data, error } = await admin
    .from("gallery_photo")
    .select("id, slug, status, storage_path, author_editor_id")
    .eq("id", id)
    .eq("author_editor_id", editorId)
    .maybeSingle();
  if (error) throw error;
  return data as ExistingPhoto | null;
}

async function savePhoto({
  admin,
  editorId,
  existing,
  fields,
  storagePath,
  status,
}: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  editorId: string;
  existing: ExistingPhoto | null;
  fields: ReturnType<typeof galleryFieldsFrom>;
  storagePath: string;
  status?: "draft" | "published";
}): Promise<GalleryPhoto> {
  const values = { ...fields, storage_path: storagePath, ...(status ? { status } : {}) };
  if (existing) {
    const { data, error } = await admin
      .from("gallery_photo")
      .update(values)
      .eq("id", existing.id)
      .eq("author_editor_id", editorId)
      .select("id, slug, status, storage_path")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Gallery Photo not found.");
    return data as GalleryPhoto;
  }

  const { data, error } = await admin
    .from("gallery_photo")
    .insert({ ...values, author_editor_id: editorId, status: "draft" })
    .select("id, slug, status, storage_path")
    .single();
  if (error) throw error;
  return data as GalleryPhoto;
}

async function uploadToStaging(admin: ReturnType<typeof getSupabaseAdminClient>, image: ImageDetails) {
  const { error } = await admin.storage.from(STAGING_BUCKET).upload(image.path, image.file, {
    contentType: image.contentType,
    upsert: false,
  });
  if (error) throw error;
}

async function copyObject(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  sourceBucket: string,
  destinationBucket: string,
  path: string,
  upsert = false,
) {
  const { data, error: downloadError } = await admin.storage.from(sourceBucket).download(path);
  if (downloadError || !data) throw downloadError ?? new Error("The Gallery image could not be read.");

  const { error: uploadError } = await admin.storage.from(destinationBucket).upload(path, data, { upsert });
  if (uploadError) throw uploadError;
}

async function removeObject(admin: ReturnType<typeof getSupabaseAdminClient>, bucket: string, path: string) {
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw error;
}

async function safelyRemove(admin: ReturnType<typeof getSupabaseAdminClient>, bucket: string, path: string) {
  try {
    await admin.storage.from(bucket).remove([path]);
  } catch {
    // A rollback clean-up must not mask the original failure for the Editor.
  }
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requiredString(value: FormDataEntryValue | null, error: string) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(error);
  return value;
}

function stringOrEmpty(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function emptyToNull(value: FormDataEntryValue | null) {
  const normalized = stringOrEmpty(value).trim();
  return normalized || null;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function jsonWithSessionCookies(
  response: NextResponse,
  body: { error?: string; photo?: GalleryPhoto },
  status: number,
) {
  const json = NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  for (const cookie of response.cookies.getAll()) json.cookies.set(cookie);
  return json;
}

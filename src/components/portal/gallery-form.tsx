"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeSlugInput } from "@/lib/content/slug";
import { PublishRequirements } from "./publish-requirements";
import { DeleteContentButton } from "./delete-content-button";
import { usePortalLocale } from "./portal-locale-provider";

export const GALLERY_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GalleryPhoto = {
  id: string;
  slug: string;
  status: "draft" | "published";
  storage_path?: string | null;
  caption_ar?: string | null;
  caption_fr?: string | null;
  caption_en?: string | null;
  taken_date?: string | null;
  photographer_credit_ar?: string | null;
  photographer_credit_fr?: string | null;
  photographer_credit_en?: string | null;
  category_ar?: string | null;
  category_fr?: string | null;
  category_en?: string | null;
};

type GalleryFields = {
  slug: string;
  caption_ar: string;
  caption_fr: string;
  caption_en: string;
  taken_date: string;
  photographer_credit_ar: string;
  photographer_credit_fr: string;
  photographer_credit_en: string;
  category_ar: string;
  category_fr: string;
  category_en: string;
};

const EMPTY_FIELDS: GalleryFields = {
  slug: "",
  caption_ar: "",
  caption_fr: "",
  caption_en: "",
  taken_date: "",
  photographer_credit_ar: "",
  photographer_credit_fr: "",
  photographer_credit_en: "",
  category_ar: "",
  category_fr: "",
  category_en: "",
};

function fieldsFrom(photo?: GalleryPhoto): GalleryFields {
  if (!photo) return EMPTY_FIELDS;

  return {
    slug: photo.slug,
    caption_ar: photo.caption_ar ?? "",
    caption_fr: photo.caption_fr ?? "",
    caption_en: photo.caption_en ?? "",
    taken_date: photo.taken_date ?? "",
    photographer_credit_ar: photo.photographer_credit_ar ?? "",
    photographer_credit_fr: photo.photographer_credit_fr ?? "",
    photographer_credit_en: photo.photographer_credit_en ?? "",
    category_ar: photo.category_ar ?? "",
    category_fr: photo.category_fr ?? "",
    category_en: photo.category_en ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isCompleteAcrossLocales(arabic: string, french: string, english: string) {
  return isFilled(arabic) === isFilled(french) && isFilled(french) === isFilled(english);
}

function clientImageError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > GALLERY_IMAGE_MAX_BYTES) {
    return "Choose an image no larger than 8 MB.";
  }
  return null;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function GalleryForm({ photo }: { photo?: GalleryPhoto }) {
  const router = useRouter();
  const { t } = usePortalLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState(() => fieldsFrom(photo));
  const [status, setStatus] = useState(photo?.status ?? "draft");
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const isPublished = status === "published";
  const canPublish = Boolean(photo?.id)
    && isFilled(fields.caption_ar)
    && isFilled(fields.caption_fr)
    && isFilled(fields.caption_en)
    && isFilled(fields.taken_date)
    && isCompleteAcrossLocales(fields.photographer_credit_ar, fields.photographer_credit_fr, fields.photographer_credit_en)
    && isCompleteAcrossLocales(fields.category_ar, fields.category_fr, fields.category_en)
    && Boolean(image || photo?.storage_path);
  const publishRequirements = [
    !photo ? "Save this draft before publishing." : "",
    !isFilled(fields.caption_ar) ? "Arabic caption" : "", !isFilled(fields.caption_fr) ? "French caption" : "", !isFilled(fields.caption_en) ? "English caption" : "",
    !isFilled(fields.taken_date) ? "Date taken" : "", !(image || photo?.storage_path) ? "Gallery image" : "",
    !isCompleteAcrossLocales(fields.photographer_credit_ar, fields.photographer_credit_fr, fields.photographer_credit_en) ? "Photographer credit in Arabic, French, and English — or leave all three blank" : "",
    !isCompleteAcrossLocales(fields.category_ar, fields.category_fr, fields.category_en) ? "Category in Arabic, French, and English — or leave all three blank" : "",
  ].filter(Boolean);

  function changeField(name: keyof GalleryFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function chooseImage(file: File | undefined) {
    if (!file) return;
    const error = clientImageError(file);
    setImageError(error ?? "");
    if (!error) setImage(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    chooseImage(event.dataTransfer.files.item(0) ?? undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save("save");
  }

  async function save(action: "save" | "publish" | "unpublish") {
    setMessage("");
    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Gallery Photo.");
      return;
    }
    if (!photo && !image) {
      setMessage("Choose an image before saving this Gallery Photo.");
      return;
    }
    if (imageError) {
      setMessage(imageError);
      return;
    }

    if (action === "publish") setPublishing(true);
    else if (action === "unpublish") setUnpublishing(true);
    else setSaving(true);

    try {
      const payload = new FormData();
      payload.set("id", photo?.id ?? "");
      payload.set("action", action);
      for (const [key, value] of Object.entries(fields)) payload.set(key, value);
      if (image) payload.set("image", image, image.name);

      const response = await fetch("/api/portal/gallery", { method: "POST", body: payload });
      const result = await response.json() as {
        error?: string;
        photo?: Pick<GalleryPhoto, "id" | "slug" | "status" | "storage_path">;
      };
      if (!response.ok || !result.photo) throw new Error(result.error ?? "The Gallery Photo could not be saved.");

      setStatus(result.photo.status);
      setImage(null);
      if (!photo) {
        router.replace(`/portal/gallery/${result.photo.slug}`);
        return;
      }

      if (action === "publish") setMessage("Published. The Profile will update after its deployment completes.");
      else if (action === "unpublish") setMessage("Moved back to draft. Its public image is no longer available.");
      else setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "The Gallery Photo could not be saved."));
    } finally {
      setSaving(false);
      setPublishing(false);
      setUnpublishing(false);
    }
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={submit}>
      {isPublished ? (
        <p className="rounded border border-gold-300 bg-gold-200 p-3 text-sm text-navy">
          This Gallery Photo is public. Replacing its image keeps the new file public; moving it to draft removes the public image.
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink" htmlFor="gallery-slug">
          {t("URL slug")}
          <input
            id="gallery-slug"
            value={fields.slug}
            onChange={(event) => changeField("slug", normalizeSlugInput(event.target.value))}
            className="border-b border-line-soft bg-transparent px-1 py-2 text-ink outline-none focus:border-b-2 focus:border-gold"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <p className="text-sm text-ink-700">{t("Status:")} {t(status)}</p>
      </section>

      <section className="flex flex-col gap-4 rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5" aria-labelledby="gallery-image-title">
        <div>
          <h2 id="gallery-image-title" className="font-serif text-xl font-semibold text-ink">{t("Gallery image")}</h2>
          <p className="mt-1 text-sm text-ink-700">{t("JPEG, PNG, or WebP, up to 8 MB. Draft images remain private until published.")}</p>
        </div>
        <div
          className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-line-soft bg-surface-low p-4 text-center text-ink"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInput.current?.click();
          }}
          aria-label={t("Gallery image upload area")}
        >
          <span className="font-semibold">{t("Drop an image here or choose a file")}</span>
          <span className="text-sm text-ink-700">{image ? image.name : photo?.storage_path ? t("Current image is kept unless you choose a replacement.") : t("No image selected.")}</span>
        </div>
        <input
          ref={fileInput}
          id="gallery-image"
          aria-label={t("Gallery image file")}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => chooseImage(event.target.files?.[0])}
        />
        {imageError ? <p role="alert" className="text-sm text-red-300">{imageError}</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <LocalePane
          locale="Arabic"
          direction="rtl"
          caption={fields.caption_ar}
          credit={fields.photographer_credit_ar}
          category={fields.category_ar}
          onCaptionChange={(value) => changeField("caption_ar", value)}
          onCreditChange={(value) => changeField("photographer_credit_ar", value)}
          onCategoryChange={(value) => changeField("category_ar", value)}
        />
        <LocalePane
          locale="French"
          direction="ltr"
          caption={fields.caption_fr}
          credit={fields.photographer_credit_fr}
          category={fields.category_fr}
          onCaptionChange={(value) => changeField("caption_fr", value)}
          onCreditChange={(value) => changeField("photographer_credit_fr", value)}
          onCategoryChange={(value) => changeField("category_fr", value)}
        />
        <LocalePane locale="English" direction="ltr" caption={fields.caption_en} credit={fields.photographer_credit_en} category={fields.category_en} onCaptionChange={(value) => changeField("caption_en", value)} onCreditChange={(value) => changeField("photographer_credit_en", value)} onCategoryChange={(value) => changeField("category_en", value)} />
      </div>

      <section className="rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5">
        <TextField label={t("Date taken")} id="gallery-taken-date" type="date" value={fields.taken_date} onChange={(value) => changeField("taken_date", value)} />
      </section>

      {message ? <p role="alert" className="rounded border border-line bg-surface-low p-3 text-sm text-ink">{message}</p> : null}
      <PublishRequirements requirements={publishRequirements} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing || unpublishing} className="rounded bg-gold px-4 py-2 font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? t("Saving...") : isPublished ? t("Save changes") : t("Save as draft")}
        </button>
        {!isPublished ? (
          <button type="button" disabled={!canPublish || saving || publishing || unpublishing} onClick={() => void save("publish")} className="rounded border border-gold px-4 py-2 font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-60">
            {publishing ? t("Publishing...") : t("Publish")}
          </button>
        ) : (
          <button type="button" disabled={saving || publishing || unpublishing} onClick={() => void save("unpublish")} className="rounded border border-gold px-4 py-2 font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-60">
            {unpublishing ? t("Moving to draft...") : t("Move to draft")}
          </button>
        )}
      </div>
      {photo ? <DeleteContentButton itemType="gallery_photo" id={photo.id} returnTo="/portal/gallery" /> : null}
      {!photo ? <p className="text-sm text-ink-700">{t("Save the draft before publishing it.")}</p> : null}
    </form>
  );
}

function LocalePane({
  locale,
  direction,
  caption,
  credit,
  category,
  onCaptionChange,
  onCreditChange,
  onCategoryChange,
}: {
  locale: "Arabic" | "French" | "English";
  direction: "rtl" | "ltr";
  caption: string;
  credit: string;
  category: string;
  onCaptionChange: (value: string) => void;
  onCreditChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}) {
  const suffix = locale.toLowerCase();
  return (
    <section dir={direction} className="flex flex-col gap-4 rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5">
      <h2 className="font-serif text-xl font-semibold text-ink">{locale}</h2>
      <TextField label={`${locale} caption`} id={`gallery-caption-${suffix}`} value={caption} onChange={onCaptionChange} />
      <TextField label={`${locale} photographer credit`} id={`gallery-credit-${suffix}`} value={credit} onChange={onCreditChange} optional />
      <TextField label={`${locale} category`} id={`gallery-category-${suffix}`} value={category} onChange={onCategoryChange} optional />
    </section>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  optional = false,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  type?: "text" | "date";
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-ink" htmlFor={id}>
      {label}{optional ? " (optional)" : ""}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-b border-line-soft bg-transparent px-1 py-2 text-ink outline-none focus:border-b-2 focus:border-gold"
      />
    </label>
  );
}

"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export const GALLERY_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GalleryPhoto = {
  id: string;
  slug: string;
  status: "draft" | "published";
  storage_path?: string | null;
  caption_ar?: string | null;
  caption_fr?: string | null;
  taken_date?: string | null;
  photographer_credit_ar?: string | null;
  photographer_credit_fr?: string | null;
  category_ar?: string | null;
  category_fr?: string | null;
};

type GalleryFields = {
  slug: string;
  caption_ar: string;
  caption_fr: string;
  taken_date: string;
  photographer_credit_ar: string;
  photographer_credit_fr: string;
  category_ar: string;
  category_fr: string;
};

const EMPTY_FIELDS: GalleryFields = {
  slug: "",
  caption_ar: "",
  caption_fr: "",
  taken_date: "",
  photographer_credit_ar: "",
  photographer_credit_fr: "",
  category_ar: "",
  category_fr: "",
};

function fieldsFrom(photo?: GalleryPhoto): GalleryFields {
  if (!photo) return EMPTY_FIELDS;

  return {
    slug: photo.slug,
    caption_ar: photo.caption_ar ?? "",
    caption_fr: photo.caption_fr ?? "",
    taken_date: photo.taken_date ?? "",
    photographer_credit_ar: photo.photographer_credit_ar ?? "",
    photographer_credit_fr: photo.photographer_credit_fr ?? "",
    category_ar: photo.category_ar ?? "",
    category_fr: photo.category_fr ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isPaired(left: string, right: string) {
  return isFilled(left) === isFilled(right);
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
    && isFilled(fields.taken_date)
    && isPaired(fields.photographer_credit_ar, fields.photographer_credit_fr)
    && isPaired(fields.category_ar, fields.category_fr)
    && Boolean(image || photo?.storage_path);

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
        <p className="rounded border border-[#fdc34d] bg-[#ffdea6] p-3 text-sm text-[#04162e]">
          This Gallery Photo is public. Replacing its image keeps the new file public; moving it to draft removes the public image.
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#04162e]" htmlFor="gallery-slug">
          URL slug
          <input
            id="gallery-slug"
            value={fields.slug}
            onChange={(event) => changeField("slug", event.target.value)}
            className="border-b border-[#75777e] bg-transparent px-1 py-2 text-[#191c1d] outline-none focus:border-b-2 focus:border-[#7b5800]"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <p className="text-sm text-[#44474d]">Status: {status}</p>
      </section>

      <section className="flex flex-col gap-4 rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5" aria-labelledby="gallery-image-title">
        <div>
          <h2 id="gallery-image-title" className="font-serif text-xl font-semibold text-[#04162e]">Gallery image</h2>
          <p className="mt-1 text-sm text-[#44474d]">JPEG, PNG, or WebP, up to 8 MB. Draft images remain private until published.</p>
        </div>
        <div
          className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-[#75777e] bg-[#f3f4f5] p-4 text-center text-[#04162e]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInput.current?.click();
          }}
          aria-label="Gallery image upload area"
        >
          <span className="font-semibold">Drop an image here or choose a file</span>
          <span className="text-sm text-[#44474d]">{image ? image.name : photo?.storage_path ? "Current image is kept unless you choose a replacement." : "No image selected."}</span>
        </div>
        <input
          ref={fileInput}
          id="gallery-image"
          aria-label="Gallery image file"
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => chooseImage(event.target.files?.[0])}
        />
        {imageError ? <p role="alert" className="text-sm text-[#93000a]">{imageError}</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      <section className="rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5">
        <TextField label="Date taken" id="gallery-taken-date" type="date" value={fields.taken_date} onChange={(value) => changeField("taken_date", value)} />
      </section>

      {message ? <p role="alert" className="rounded border border-[#c5c6ce] bg-[#f3f4f5] p-3 text-sm text-[#191c1d]">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing || unpublishing} className="rounded bg-[#04162e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : isPublished ? "Save changes" : "Save as draft"}
        </button>
        {!isPublished ? (
          <button type="button" disabled={!canPublish || saving || publishing || unpublishing} onClick={() => void save("publish")} className="rounded border border-[#7b5800] px-4 py-2 font-semibold text-[#04162e] disabled:cursor-not-allowed disabled:opacity-60">
            {publishing ? "Publishing..." : "Publish"}
          </button>
        ) : (
          <button type="button" disabled={saving || publishing || unpublishing} onClick={() => void save("unpublish")} className="rounded border border-[#7b5800] px-4 py-2 font-semibold text-[#04162e] disabled:cursor-not-allowed disabled:opacity-60">
            {unpublishing ? "Moving to draft..." : "Move to draft"}
          </button>
        )}
      </div>
      {!photo ? <p className="text-sm text-[#44474d]">Save the draft before publishing it.</p> : null}
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
  locale: "Arabic" | "French";
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
    <section dir={direction} className="flex flex-col gap-4 rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5">
      <h2 className="font-serif text-xl font-semibold text-[#04162e]">{locale}</h2>
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
    <label className="flex flex-col gap-2 text-sm font-semibold text-[#04162e]" htmlFor={id}>
      {label}{optional ? " (optional)" : ""}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-b border-[#75777e] bg-transparent px-1 py-2 text-[#191c1d] outline-none focus:border-b-2 focus:border-[#7b5800]"
      />
    </label>
  );
}

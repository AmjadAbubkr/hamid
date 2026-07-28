"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { normalizeSlugInput } from "@/lib/content/slug";
import { PublishRequirements } from "./publish-requirements";
import { usePortalLocale } from "./portal-locale-provider";

export type PositionHeld = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title_ar?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  body_ar?: string | null;
  body_fr?: string | null;
  body_en?: string | null;
  institution?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  published_at?: string | null;
};

type PositionFields = {
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  body_ar: string;
  body_fr: string;
  body_en: string;
  institution: string;
  start_date: string;
  end_date: string;
  location: string;
};

const EMPTY_FIELDS: PositionFields = {
  slug: "",
  title_ar: "",
  title_fr: "",
  title_en: "",
  body_ar: "",
  body_fr: "",
  body_en: "",
  institution: "",
  start_date: "",
  end_date: "",
  location: "",
};

function fieldsFrom(position?: PositionHeld): PositionFields {
  if (!position) return EMPTY_FIELDS;

  return {
    slug: position.slug,
    title_ar: position.title_ar ?? "",
    title_fr: position.title_fr ?? "",
    title_en: position.title_en ?? "",
    body_ar: position.body_ar ?? "",
    body_fr: position.body_fr ?? "",
    body_en: position.body_en ?? "",
    institution: position.institution ?? "",
    start_date: position.start_date ?? "",
    end_date: position.end_date ?? "",
    location: position.location ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function PositionForm({ position }: { position?: PositionHeld }) {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [fields, setFields] = useState(() => fieldsFrom(position));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(position?.status ?? "draft");

  const summariesArePaired = isFilled(fields.body_ar) === isFilled(fields.body_fr)
    && isFilled(fields.body_fr) === isFilled(fields.body_en);
  const canPublish = Boolean(position?.id)
    && isFilled(fields.title_ar)
    && isFilled(fields.title_fr)
    && isFilled(fields.title_en)
    && isFilled(fields.institution)
    && isFilled(fields.start_date)
    && isFilled(fields.location)
    && summariesArePaired;
  const publishRequirements = [
    !position ? "Save this draft before publishing." : "",
    !isFilled(fields.title_ar) ? "Arabic title" : "",
    !isFilled(fields.title_fr) ? "French title" : "",
    !isFilled(fields.title_en) ? "English title" : "",
    !isFilled(fields.institution) ? "Institution" : "",
    !isFilled(fields.start_date) ? "Start date" : "",
    !isFilled(fields.location) ? "Location" : "",
    !summariesArePaired ? "Summary in Arabic, French, and English — or leave all three blank" : "",
  ].filter(Boolean);

  function changeField(name: keyof PositionFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Position Held.");
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const data = {
        slug: fields.slug.trim(),
        title_ar: fields.title_ar,
        title_fr: fields.title_fr,
        title_en: fields.title_en,
        body_ar: emptyToNull(fields.body_ar),
        body_fr: emptyToNull(fields.body_fr),
        body_en: emptyToNull(fields.body_en),
        institution: emptyToNull(fields.institution),
        start_date: emptyToNull(fields.start_date),
        end_date: emptyToNull(fields.end_date),
        location: emptyToNull(fields.location),
        status,
      };

      if (position) {
        const { error } = await supabase.from("position_held").update(data).eq("id", position.id);
        if (error) throw error;
        setMessage("Saved.");
        router.refresh();
        return;
      }

      const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
      if (editorError || typeof editorId !== "string") {
        throw editorError ?? new Error("The current Editor record could not be found.");
      }

      const { data: created, error } = await supabase
        .from("position_held")
        .insert({ ...data, author_editor_id: editorId })
        .select("id, slug, status")
        .single();
      if (error || !created) throw error ?? new Error("The Position Held could not be created.");

      router.replace(`/portal/positions/${created.slug}`);
    } catch (error) {
      setMessage(messageFor(error, "The draft could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!position || !canPublish) return;

    setMessage("");
    setPublishing(true);
    try {
      const { error } = await getSupabaseClient().rpc("publish_content_item", {
        item_type: "position_held",
        item_id: position.id,
      });
      if (error) throw error;

      setStatus("published");
      setMessage("Published. The Profile will update after its deployment completes.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "This Position Held could not be published."));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={saveDraft}>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-slug">
          {t("URL slug")}
          <input
            id="position-slug"
            name="slug"
            value={fields.slug}
            onChange={(event) => changeField("slug", normalizeSlugInput(event.target.value))}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <p className="text-sm text-zinc-600">{t("Status:")} {t(status)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <LocalePane
          locale={t("Arabic")}
          direction="rtl"
          title={fields.title_ar}
          body={fields.body_ar}
          onTitleChange={(value) => changeField("title_ar", value)}
          onBodyChange={(value) => changeField("body_ar", value)}
        />
        <LocalePane
          locale={t("French")}
          direction="ltr"
          title={fields.title_fr}
          body={fields.body_fr}
          onTitleChange={(value) => changeField("title_fr", value)}
          onBodyChange={(value) => changeField("body_fr", value)}
        />
        <LocalePane
          locale={t("English")}
          direction="ltr"
          title={fields.title_en}
          body={fields.body_en}
          onTitleChange={(value) => changeField("title_en", value)}
          onBodyChange={(value) => changeField("body_en", value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
        <legend className="px-1 text-base font-semibold text-zinc-950">{t("Position details")}</legend>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-institution">
          {t("Institution")}
          <input
            id="position-institution"
            value={fields.institution}
            onChange={(event) => changeField("institution", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-start-date">
            {t("Start date")}
            <input
              id="position-start-date"
              type="date"
              value={fields.start_date}
              onChange={(event) => changeField("start_date", event.target.value)}
              className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-end-date">
            {t("End date (leave empty for present)")}
            <input
              id="position-end-date"
              type="date"
              value={fields.end_date}
              onChange={(event) => changeField("end_date", event.target.value)}
              className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-location">
          {t("Location")}
          <input
            id="position-location"
            value={fields.location}
            onChange={(event) => changeField("location", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          />
        </label>
      </fieldset>

      {message ? <p role="alert" className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">{message}</p> : null}

      <PublishRequirements requirements={publishRequirements} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || publishing}
          className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t("Saving…") : t("Save as draft")}
        </button>
        <button
          type="button"
          disabled={!canPublish || saving || publishing}
          onClick={publish}
          className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {publishing ? t("Publishing…") : t("Publish")}
        </button>
      </div>
      {!position ? <p className="text-sm text-zinc-600">{t("Save the draft before publishing it.")}</p> : null}
    </form>
  );
}

function LocalePane({
  locale,
  direction,
  title,
  body,
  onTitleChange,
  onBodyChange,
}: {
  locale: string;
  direction: "rtl" | "ltr";
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}) {
  const { t } = usePortalLocale();
  const id = direction === "rtl" ? "arabic" : locale === t("French") ? "french" : "english";

  return (
    <section dir={direction} className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-950">{locale}</h2>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`position-title-${id}`}>
        {locale} {t("title")}
        <input
          id={`position-title-${id}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`position-summary-${id}`}>
        {locale} {t("summary")}
        <textarea
          id={`position-summary-${id}`}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          className="min-h-28 rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
        />
      </label>
    </section>
  );
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

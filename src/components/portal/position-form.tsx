"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export type PositionHeld = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title_ar?: string | null;
  title_fr?: string | null;
  body_ar?: string | null;
  body_fr?: string | null;
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
  body_ar: string;
  body_fr: string;
  institution: string;
  start_date: string;
  end_date: string;
  location: string;
};

const EMPTY_FIELDS: PositionFields = {
  slug: "",
  title_ar: "",
  title_fr: "",
  body_ar: "",
  body_fr: "",
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
    body_ar: position.body_ar ?? "",
    body_fr: position.body_fr ?? "",
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
  const [fields, setFields] = useState(() => fieldsFrom(position));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(position?.status ?? "draft");

  const summariesArePaired = isFilled(fields.body_ar) === isFilled(fields.body_fr);
  const canPublish = Boolean(position?.id)
    && isFilled(fields.title_ar)
    && isFilled(fields.title_fr)
    && isFilled(fields.institution)
    && isFilled(fields.start_date)
    && isFilled(fields.location)
    && summariesArePaired;

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
        body_ar: emptyToNull(fields.body_ar),
        body_fr: emptyToNull(fields.body_fr),
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
          URL slug
          <input
            id="position-slug"
            name="slug"
            value={fields.slug}
            onChange={(event) => changeField("slug", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <p className="text-sm text-zinc-600">Status: {status}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LocalePane
          locale="Arabic"
          direction="rtl"
          title={fields.title_ar}
          body={fields.body_ar}
          onTitleChange={(value) => changeField("title_ar", value)}
          onBodyChange={(value) => changeField("body_ar", value)}
        />
        <LocalePane
          locale="French"
          direction="ltr"
          title={fields.title_fr}
          body={fields.body_fr}
          onTitleChange={(value) => changeField("title_fr", value)}
          onBodyChange={(value) => changeField("body_fr", value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
        <legend className="px-1 text-base font-semibold text-zinc-950">Position details</legend>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-institution">
          Institution
          <input
            id="position-institution"
            value={fields.institution}
            onChange={(event) => changeField("institution", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-start-date">
            Start date
            <input
              id="position-start-date"
              type="date"
              value={fields.start_date}
              onChange={(event) => changeField("start_date", event.target.value)}
              className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="position-end-date">
            End date (leave empty for present)
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
          Location
          <input
            id="position-location"
            value={fields.location}
            onChange={(event) => changeField("location", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          />
        </label>
      </fieldset>

      {message ? <p role="alert" className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || publishing}
          className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          disabled={!canPublish || saving || publishing}
          onClick={publish}
          className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>
      {!position ? <p className="text-sm text-zinc-600">Save the draft before publishing it.</p> : null}
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
  locale: "Arabic" | "French";
  direction: "rtl" | "ltr";
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}) {
  const id = locale.toLowerCase();

  return (
    <section dir={direction} className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-950">{locale}</h2>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`position-title-${id}`}>
        {locale} title
        <input
          id={`position-title-${id}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`position-summary-${id}`}>
        {locale} summary
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

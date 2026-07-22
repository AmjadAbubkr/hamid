"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export type EducationEntry = {
  id: string;
  slug: string;
  status: "draft" | "published";
  degree_ar?: string | null;
  degree_fr?: string | null;
  institution_ar?: string | null;
  institution_fr?: string | null;
  honours_ar?: string | null;
  honours_fr?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  published_at?: string | null;
};

type EducationFields = {
  slug: string;
  degree_ar: string;
  degree_fr: string;
  institution_ar: string;
  institution_fr: string;
  honours_ar: string;
  honours_fr: string;
  start_date: string;
  end_date: string;
  location: string;
};

const EMPTY_FIELDS: EducationFields = {
  slug: "",
  degree_ar: "",
  degree_fr: "",
  institution_ar: "",
  institution_fr: "",
  honours_ar: "",
  honours_fr: "",
  start_date: "",
  end_date: "",
  location: "",
};

function fieldsFrom(education?: EducationEntry): EducationFields {
  if (!education) return EMPTY_FIELDS;

  return {
    slug: education.slug,
    degree_ar: education.degree_ar ?? "",
    degree_fr: education.degree_fr ?? "",
    institution_ar: education.institution_ar ?? "",
    institution_fr: education.institution_fr ?? "",
    honours_ar: education.honours_ar ?? "",
    honours_fr: education.honours_fr ?? "",
    start_date: education.start_date ?? "",
    end_date: education.end_date ?? "",
    location: education.location ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isPaired(left: string, right: string) {
  return isFilled(left) === isFilled(right);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function EducationForm({ education }: { education?: EducationEntry }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(education));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(education?.status ?? "draft");

  const canPublish = Boolean(education?.id)
    && isFilled(fields.degree_ar)
    && isFilled(fields.degree_fr)
    && isFilled(fields.institution_ar)
    && isFilled(fields.institution_fr)
    && isFilled(fields.start_date)
    && isFilled(fields.end_date)
    && isFilled(fields.location)
    && isPaired(fields.honours_ar, fields.honours_fr);

  function changeField(name: keyof EducationFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Education Entry.");
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const data = {
        slug: fields.slug.trim(),
        degree_ar: fields.degree_ar,
        degree_fr: fields.degree_fr,
        institution_ar: fields.institution_ar,
        institution_fr: fields.institution_fr,
        honours_ar: emptyToNull(fields.honours_ar),
        honours_fr: emptyToNull(fields.honours_fr),
        start_date: emptyToNull(fields.start_date),
        end_date: emptyToNull(fields.end_date),
        location: emptyToNull(fields.location),
        status,
      };

      if (education) {
        const { error } = await supabase.from("education_entry").update(data).eq("id", education.id);
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
        .from("education_entry")
        .insert({ ...data, author_editor_id: editorId })
        .select("id, slug, status")
        .single();
      if (error || !created) throw error ?? new Error("The Education Entry could not be created.");

      router.replace(`/portal/education/${created.slug}`);
    } catch (error) {
      setMessage(errorMessage(error, "The draft could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!education || !canPublish) return;

    setMessage("");
    setPublishing(true);
    try {
      const { error } = await getSupabaseClient().rpc("publish_content_item", {
        item_type: "education_entry",
        item_id: education.id,
      });
      if (error) throw error;

      setStatus("published");
      setMessage("Published. The Profile will update after its deployment completes.");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error, "This Education Entry could not be published."));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={saveDraft}>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="education-slug">
          URL slug
          <input
            id="education-slug"
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
          degree={fields.degree_ar}
          institution={fields.institution_ar}
          honours={fields.honours_ar}
          onDegreeChange={(value) => changeField("degree_ar", value)}
          onInstitutionChange={(value) => changeField("institution_ar", value)}
          onHonoursChange={(value) => changeField("honours_ar", value)}
        />
        <LocalePane
          locale="French"
          direction="ltr"
          degree={fields.degree_fr}
          institution={fields.institution_fr}
          honours={fields.honours_fr}
          onDegreeChange={(value) => changeField("degree_fr", value)}
          onInstitutionChange={(value) => changeField("institution_fr", value)}
          onHonoursChange={(value) => changeField("honours_fr", value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
        <legend className="px-1 text-base font-semibold text-zinc-950">Education details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="education-start-date">
            Start date
            <input
              id="education-start-date"
              type="date"
              value={fields.start_date}
              onChange={(event) => changeField("start_date", event.target.value)}
              className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="education-end-date">
            End date
            <input
              id="education-end-date"
              type="date"
              value={fields.end_date}
              onChange={(event) => changeField("end_date", event.target.value)}
              className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="education-location">
          Location
          <input
            id="education-location"
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
          {saving ? "Saving..." : "Save as draft"}
        </button>
        <button
          type="button"
          disabled={!canPublish || saving || publishing}
          onClick={publish}
          className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
      {!education ? <p className="text-sm text-zinc-600">Save the draft before publishing it.</p> : null}
    </form>
  );
}

function LocalePane({
  locale,
  direction,
  degree,
  institution,
  honours,
  onDegreeChange,
  onInstitutionChange,
  onHonoursChange,
}: {
  locale: "Arabic" | "French";
  direction: "rtl" | "ltr";
  degree: string;
  institution: string;
  honours: string;
  onDegreeChange: (value: string) => void;
  onInstitutionChange: (value: string) => void;
  onHonoursChange: (value: string) => void;
}) {
  const id = locale.toLowerCase();

  return (
    <section dir={direction} className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-950">{locale}</h2>
      <TextField label={`${locale} degree`} id={`education-degree-${id}`} value={degree} onChange={onDegreeChange} />
      <TextField label={`${locale} institution`} id={`education-institution-${id}`} value={institution} onChange={onInstitutionChange} />
      <TextField label={`${locale} honours`} id={`education-honours-${id}`} value={honours} onChange={onHonoursChange} optional />
    </section>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={id}>
      {label}{optional ? " (optional)" : ""}
      <input
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
      />
    </label>
  );
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

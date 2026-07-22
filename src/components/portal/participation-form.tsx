"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PARTICIPATION_ROLES,
  type ParticipationRole,
} from "@/lib/content/participation-roles";
import { getSupabaseClient } from "@/lib/supabase/client";

export type PastParticipation = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title_ar?: string | null;
  title_fr?: string | null;
  body_ar?: string | null;
  body_fr?: string | null;
  venue_ar?: string | null;
  venue_fr?: string | null;
  institution_ar?: string | null;
  institution_fr?: string | null;
  role?: ParticipationRole | null;
  role_other_ar?: string | null;
  role_other_fr?: string | null;
  source_url?: string | null;
  event_date?: string | null;
  event_end_date?: string | null;
  event_date_label?: string | null;
};

type ParticipationFields = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string;
  body_fr: string;
  venue_ar: string;
  venue_fr: string;
  institution_ar: string;
  institution_fr: string;
  role: ParticipationRole | "";
  role_other_ar: string;
  role_other_fr: string;
  source_url: string;
  event_date: string;
  event_end_date: string;
  event_date_label: string;
};

const EMPTY_FIELDS: ParticipationFields = {
  slug: "",
  title_ar: "",
  title_fr: "",
  body_ar: "",
  body_fr: "",
  venue_ar: "",
  venue_fr: "",
  institution_ar: "",
  institution_fr: "",
  role: "",
  role_other_ar: "",
  role_other_fr: "",
  source_url: "",
  event_date: "",
  event_end_date: "",
  event_date_label: "",
};

function fieldsFrom(participation?: PastParticipation): ParticipationFields {
  if (!participation) return EMPTY_FIELDS;

  return {
    slug: participation.slug,
    title_ar: participation.title_ar ?? "",
    title_fr: participation.title_fr ?? "",
    body_ar: participation.body_ar ?? "",
    body_fr: participation.body_fr ?? "",
    venue_ar: participation.venue_ar ?? "",
    venue_fr: participation.venue_fr ?? "",
    institution_ar: participation.institution_ar ?? "",
    institution_fr: participation.institution_fr ?? "",
    role: participation.role ?? "",
    role_other_ar: participation.role_other_ar ?? "",
    role_other_fr: participation.role_other_fr ?? "",
    source_url: participation.source_url ?? "",
    event_date: participation.event_date ?? "",
    event_end_date: participation.event_end_date ?? "",
    event_date_label: participation.event_date_label ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isPaired(left: string, right: string) {
  return isFilled(left) === isFilled(right);
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ParticipationForm({ participation }: { participation?: PastParticipation }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(participation));
  const [status, setStatus] = useState(participation?.status ?? "draft");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const isPublished = participation?.status === "published";

  const roleOtherIsComplete = fields.role !== "Other" || (
    isFilled(fields.role_other_ar) && isFilled(fields.role_other_fr)
  );
  const eventRangeIsValid = !isFilled(fields.event_end_date)
    || (isFilled(fields.event_date) && fields.event_end_date >= fields.event_date);
  const canPublish = Boolean(participation?.id)
    && isFilled(fields.title_ar)
    && isFilled(fields.title_fr)
    && isPaired(fields.body_ar, fields.body_fr)
    && isFilled(fields.venue_ar)
    && isFilled(fields.venue_fr)
    && isFilled(fields.institution_ar)
    && isFilled(fields.institution_fr)
    && isFilled(fields.event_date)
    && isFilled(fields.event_date_label)
    && isFilled(fields.role)
    && roleOtherIsComplete
    && eventRangeIsValid;

  function changeField(name: keyof ParticipationFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (isPublished) {
      setMessage("Published Past Participations are immutable historical records.");
      return;
    }
    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Past Participation.");
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
        venue_ar: fields.venue_ar,
        venue_fr: fields.venue_fr,
        institution_ar: fields.institution_ar,
        institution_fr: fields.institution_fr,
        role: fields.role || null,
        role_other_ar: fields.role === "Other" ? emptyToNull(fields.role_other_ar) : null,
        role_other_fr: fields.role === "Other" ? emptyToNull(fields.role_other_fr) : null,
        source_url: emptyToNull(fields.source_url),
        event_date: emptyToNull(fields.event_date),
        event_end_date: emptyToNull(fields.event_end_date),
        event_date_label: fields.event_date_label,
        status,
      };

      if (participation) {
        const { error } = await supabase.from("past_participation").update(data).eq("id", participation.id);
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
        .from("past_participation")
        .insert({ ...data, author_editor_id: editorId })
        .select("id, slug, status")
        .single();
      if (error || !created) throw error ?? new Error("The Past Participation could not be created.");

      router.replace(`/portal/participations/${created.slug}`);
    } catch (error) {
      setMessage(messageFor(error, "The draft could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!participation || !canPublish) return;

    setMessage("");
    setPublishing(true);
    try {
      const { error } = await getSupabaseClient().rpc("publish_content_item", {
        item_type: "past_participation",
        item_id: participation.id,
      });
      if (error) throw error;

      setStatus("published");
      setMessage("Published. The Profile will update after its deployment completes.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "This Past Participation could not be published."));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={saveDraft}>
      {isPublished ? (
        <p className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">
          Published Past Participations are immutable historical records.
        </p>
      ) : null}
      <fieldset disabled={isPublished} className="contents">
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="participation-slug">
          URL slug
          <input
            id="participation-slug"
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
          venue={fields.venue_ar}
          institution={fields.institution_ar}
          onTitleChange={(value) => changeField("title_ar", value)}
          onBodyChange={(value) => changeField("body_ar", value)}
          onVenueChange={(value) => changeField("venue_ar", value)}
          onInstitutionChange={(value) => changeField("institution_ar", value)}
        />
        <LocalePane
          locale="French"
          direction="ltr"
          title={fields.title_fr}
          body={fields.body_fr}
          venue={fields.venue_fr}
          institution={fields.institution_fr}
          onTitleChange={(value) => changeField("title_fr", value)}
          onBodyChange={(value) => changeField("body_fr", value)}
          onVenueChange={(value) => changeField("venue_fr", value)}
          onInstitutionChange={(value) => changeField("institution_fr", value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
        <legend className="px-1 text-base font-semibold text-zinc-950">Participation details</legend>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="participation-role">
          Role
          <select
            id="participation-role"
            value={fields.role}
            onChange={(event) => changeField("role", event.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          >
            <option value="" disabled>Select a role</option>
            {PARTICIPATION_ROLES.map((role) => <option key={role} value={role}>{role === "usher" ? "Usher" : role}</option>)}
          </select>
        </label>
        {fields.role === "Other" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Arabic other role" id="participation-role-other-ar" value={fields.role_other_ar} onChange={(value) => changeField("role_other_ar", value)} />
            <TextField label="French other role" id="participation-role-other-fr" value={fields.role_other_fr} onChange={(value) => changeField("role_other_fr", value)} />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Sortable event date" id="participation-event-date" type="date" value={fields.event_date} onChange={(value) => changeField("event_date", value)} />
          <TextField label="Event end date" id="participation-event-end-date" type="date" value={fields.event_end_date} onChange={(value) => changeField("event_end_date", value)} optional />
        </div>
        <TextField label="Published date label" id="participation-event-date-label" value={fields.event_date_label} onChange={(value) => changeField("event_date_label", value)} />
        <p className="text-sm text-zinc-600">Use the published date label for a year-only date or a date range exactly as it should appear on the Profile.</p>
        <TextField label="Source URL" id="participation-source-url" type="url" value={fields.source_url} onChange={(value) => changeField("source_url", value)} optional />
      </fieldset>

      {message ? <p role="alert" className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing} className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : "Save as draft"}
        </button>
        <button type="button" disabled={!canPublish || saving || publishing} onClick={publish} className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60">
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
      {!participation ? <p className="text-sm text-zinc-600">Save the draft before publishing it.</p> : null}
      </fieldset>
    </form>
  );
}

function LocalePane({
  locale,
  direction,
  title,
  body,
  venue,
  institution,
  onTitleChange,
  onBodyChange,
  onVenueChange,
  onInstitutionChange,
}: {
  locale: "Arabic" | "French";
  direction: "rtl" | "ltr";
  title: string;
  body: string;
  venue: string;
  institution: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onInstitutionChange: (value: string) => void;
}) {
  const suffix = locale.toLowerCase();
  return (
    <section dir={direction} className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-950">{locale}</h2>
      <TextField label={`${locale} title`} id={`participation-title-${suffix}`} value={title} onChange={onTitleChange} />
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`participation-summary-${suffix}`}>
        {locale} summary (optional)
        <textarea
          id={`participation-summary-${suffix}`}
          aria-label={`${locale} summary`}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          className="min-h-28 rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
        />
      </label>
      <TextField label={`${locale} venue`} id={`participation-venue-${suffix}`} value={venue} onChange={onVenueChange} />
      <TextField label={`${locale} institution`} id={`participation-institution-${suffix}`} value={institution} onChange={onInstitutionChange} />
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
  type?: "text" | "url" | "date";
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={id}>
      {label}{optional ? " (optional)" : ""}
      <input
        id={id}
        aria-label={label}
        type={type}
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

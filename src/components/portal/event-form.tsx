"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PARTICIPATION_ROLES,
  getParticipationRoleEditorLabel,
  type ParticipationRole,
} from "@/lib/content/participation-roles";
import { getSupabaseClient } from "@/lib/supabase/client";

export type UpcomingEvent = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title_ar?: string | null;
  title_fr?: string | null;
  body_ar?: string | null;
  body_fr?: string | null;
  event_date?: string | null;
  venue_ar?: string | null;
  venue_fr?: string | null;
  institution_ar?: string | null;
  institution_fr?: string | null;
  role?: ParticipationRole | null;
  role_other_ar?: string | null;
  role_other_fr?: string | null;
  registration_url?: string | null;
};

type EventFields = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string;
  body_fr: string;
  event_date: string;
  venue_ar: string;
  venue_fr: string;
  institution_ar: string;
  institution_fr: string;
  role: ParticipationRole | "";
  role_other_ar: string;
  role_other_fr: string;
  registration_url: string;
};

const EMPTY_FIELDS: EventFields = {
  slug: "",
  title_ar: "",
  title_fr: "",
  body_ar: "",
  body_fr: "",
  event_date: "",
  venue_ar: "",
  venue_fr: "",
  institution_ar: "",
  institution_fr: "",
  role: "",
  role_other_ar: "",
  role_other_fr: "",
  registration_url: "",
};

function fieldsFrom(event?: UpcomingEvent): EventFields {
  if (!event) return EMPTY_FIELDS;

  return {
    slug: event.slug,
    title_ar: event.title_ar ?? "",
    title_fr: event.title_fr ?? "",
    body_ar: event.body_ar ?? "",
    body_fr: event.body_fr ?? "",
    event_date: event.event_date ?? "",
    venue_ar: event.venue_ar ?? "",
    venue_fr: event.venue_fr ?? "",
    institution_ar: event.institution_ar ?? "",
    institution_fr: event.institution_fr ?? "",
    role: event.role ?? "",
    role_other_ar: event.role_other_ar ?? "",
    role_other_fr: event.role_other_fr ?? "",
    registration_url: event.registration_url ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isPaired(left: string, right: string) {
  return isFilled(left) === isFilled(right);
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function EventForm({ event }: { event?: UpcomingEvent }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(event));
  const [status, setStatus] = useState(event?.status ?? "draft");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const isPublished = status === "published";
  const roleOtherIsComplete = fields.role !== "Other" || (
    isFilled(fields.role_other_ar) && isFilled(fields.role_other_fr)
  );
  const canPublish = Boolean(event?.id)
    && isFilled(fields.title_ar)
    && isFilled(fields.title_fr)
    && isPaired(fields.body_ar, fields.body_fr)
    && isFilled(fields.event_date)
    && isFilled(fields.venue_ar)
    && isFilled(fields.venue_fr)
    && isFilled(fields.institution_ar)
    && isFilled(fields.institution_fr)
    && isFilled(fields.role)
    && roleOtherIsComplete;

  function changeField(name: keyof EventFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function save(eventToSave: FormEvent<HTMLFormElement>) {
    eventToSave.preventDefault();
    setMessage("");
    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Upcoming Event.");
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
        event_date: emptyToNull(fields.event_date),
        venue_ar: fields.venue_ar,
        venue_fr: fields.venue_fr,
        institution_ar: fields.institution_ar,
        institution_fr: fields.institution_fr,
        role: fields.role || null,
        role_other_ar: fields.role === "Other" ? emptyToNull(fields.role_other_ar) : null,
        role_other_fr: fields.role === "Other" ? emptyToNull(fields.role_other_fr) : null,
        registration_url: emptyToNull(fields.registration_url),
        status,
      };

      if (event) {
        const { error } = await supabase.from("upcoming_event").update(data).eq("id", event.id);
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
        .from("upcoming_event")
        .insert({ ...data, author_editor_id: editorId })
        .select("id, slug, status")
        .single();
      if (error || !created) throw error ?? new Error("The Upcoming Event could not be created.");

      router.replace(`/portal/events/${created.slug}`);
    } catch (error) {
      setMessage(messageFor(error, "The event could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!event || !canPublish || isPublished) return;

    setMessage("");
    setPublishing(true);
    try {
      const { error } = await getSupabaseClient().rpc("publish_content_item", {
        item_type: "upcoming_event",
        item_id: event.id,
      });
      if (error) throw error;

      setStatus("published");
      setMessage("Published. You can still update this event until it is archived after its date.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "This Upcoming Event could not be published."));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={save}>
      {isPublished ? (
        <p className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">
          This event is public and remains editable until it is archived after its date.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="event-slug">
          URL slug
          <input
            id="event-slug"
            value={fields.slug}
            onChange={(input) => changeField("slug", input.target.value)}
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
        <legend className="px-1 text-base font-semibold text-zinc-950">Event details</legend>
        <TextField label="Event date" id="event-date" type="date" value={fields.event_date} onChange={(value) => changeField("event_date", value)} />
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="event-role">
          Role
          <select
            id="event-role"
            value={fields.role}
            onChange={(input) => changeField("role", input.target.value)}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
          >
            <option value="" disabled>Select a role</option>
            {PARTICIPATION_ROLES.map((role) => <option key={role} value={role}>{getParticipationRoleEditorLabel(role)}</option>)}
          </select>
        </label>
        {fields.role === "Other" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Arabic other role" id="event-role-other-ar" value={fields.role_other_ar} onChange={(value) => changeField("role_other_ar", value)} />
            <TextField label="French other role" id="event-role-other-fr" value={fields.role_other_fr} onChange={(value) => changeField("role_other_fr", value)} />
          </div>
        ) : null}
        <TextField label="Registration URL" id="event-registration-url" type="url" value={fields.registration_url} onChange={(value) => changeField("registration_url", value)} optional />
      </fieldset>

      {message ? <p role="alert" className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing} className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : isPublished ? "Save changes" : "Save as draft"}
        </button>
        {!isPublished ? (
          <button type="button" disabled={!canPublish || saving || publishing} onClick={publish} className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60">
            {publishing ? "Publishing..." : "Publish"}
          </button>
        ) : null}
      </div>
      {!event ? <p className="text-sm text-zinc-600">Save the draft before publishing it.</p> : null}
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
      <TextField label={`${locale} title`} id={`event-title-${suffix}`} value={title} onChange={onTitleChange} />
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={`event-summary-${suffix}`}>
        {locale} announcement (optional)
        <textarea
          id={`event-summary-${suffix}`}
          aria-label={`${locale} announcement`}
          value={body}
          onChange={(input) => onBodyChange(input.target.value)}
          className="min-h-28 rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
        />
      </label>
      <TextField label={`${locale} venue`} id={`event-venue-${suffix}`} value={venue} onChange={onVenueChange} />
      <TextField label={`${locale} institution`} id={`event-institution-${suffix}`} value={institution} onChange={onInstitutionChange} />
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
        onChange={(input) => onChange(input.target.value)}
        className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
      />
    </label>
  );
}

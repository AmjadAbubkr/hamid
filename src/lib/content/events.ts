import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";
import type { ParticipationRole } from "./participation-roles";

export type UpcomingEvent = {
  slug: string;
  titleAr: string;
  titleFr: string;
  bodyAr: string | null;
  bodyFr: string | null;
  eventDate: string;
  venueAr: string;
  venueFr: string;
  institutionAr: string;
  institutionFr: string;
  role: ParticipationRole;
  roleOtherAr: string | null;
  roleOtherFr: string | null;
  registrationUrl: string | null;
};

const EVENT_FIELDS =
  "slug,title_ar,title_fr,body_ar,body_fr,event_date,venue_ar,venue_fr,institution_ar,institution_fr,role,role_other_ar,role_other_fr,registration_url";

type UpcomingEventRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string | null;
  body_fr: string | null;
  event_date: string;
  venue_ar: string;
  venue_fr: string;
  institution_ar: string;
  institution_fr: string;
  role: ParticipationRole;
  role_other_ar: string | null;
  role_other_fr: string | null;
  registration_url: string | null;
};

function toUpcomingEvent(row: UpcomingEventRow): UpcomingEvent {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    eventDate: row.event_date,
    venueAr: row.venue_ar,
    venueFr: row.venue_fr,
    institutionAr: row.institution_ar,
    institutionFr: row.institution_fr,
    role: row.role,
    roleOtherAr: row.role_other_ar,
    roleOtherFr: row.role_other_fr,
    registrationUrl: row.registration_url,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getPublishedUpcomingEvents(
  client?: SupabaseClient,
  order: "ascending" | "descending" = "ascending",
): Promise<UpcomingEvent[]> {
  const supabase = getClient(client);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("upcoming_event")
    .select(EVENT_FIELDS)
    .eq("status", "published")
    .gte("event_date", currentDate())
    .order("event_date", { ascending: order === "ascending" });

  if (error) throw error;

  return ((data ?? []) as UpcomingEventRow[]).map(toUpcomingEvent);
}

export function getPublishedUpcomingEventsForListing() {
  return getPublishedUpcomingEvents(undefined, "descending");
}

export async function getPublishedUpcomingEventBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<UpcomingEvent | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("upcoming_event")
    .select(EVENT_FIELDS)
    .eq("status", "published")
    .gte("event_date", currentDate())
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toUpcomingEvent(data as UpcomingEventRow) : null;
}

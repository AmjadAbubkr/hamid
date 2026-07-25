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
  titleEn: string | null;
  bodyAr: string | null;
  bodyFr: string | null;
  bodyEn: string | null;
  eventDate: string;
  venueAr: string;
  venueFr: string;
  venueEn: string | null;
  institutionAr: string;
  institutionFr: string;
  institutionEn: string | null;
  role: ParticipationRole;
  roleOtherAr: string | null;
  roleOtherFr: string | null;
  roleOtherEn: string | null;
  registrationUrl: string | null;
};

const EVENT_FIELDS =
  "slug,title_ar,title_fr,title_en,body_ar,body_fr,body_en,event_date,venue_ar,venue_fr,venue_en,institution_ar,institution_fr,institution_en,role,role_other_ar,role_other_fr,role_other_en,registration_url";

type UpcomingEventRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string | null;
  body_ar: string | null;
  body_fr: string | null;
  body_en: string | null;
  event_date: string;
  venue_ar: string;
  venue_fr: string;
  venue_en: string | null;
  institution_ar: string;
  institution_fr: string;
  institution_en: string | null;
  role: ParticipationRole;
  role_other_ar: string | null;
  role_other_fr: string | null;
  role_other_en: string | null;
  registration_url: string | null;
};

function toUpcomingEvent(row: UpcomingEventRow): UpcomingEvent {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    bodyEn: row.body_en,
    eventDate: row.event_date,
    venueAr: row.venue_ar,
    venueFr: row.venue_fr,
    venueEn: row.venue_en,
    institutionAr: row.institution_ar,
    institutionFr: row.institution_fr,
    institutionEn: row.institution_en,
    role: row.role,
    roleOtherAr: row.role_other_ar,
    roleOtherFr: row.role_other_fr,
    roleOtherEn: row.role_other_en,
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

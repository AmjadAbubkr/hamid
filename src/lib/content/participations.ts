import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";
import type { LocaleCode } from "@/lib/i18n/locales";
import type { ParticipationRole } from "./participation-roles";

export { PARTICIPATION_ROLES, type ParticipationRole } from "./participation-roles";

const ROLE_LABELS: Record<ParticipationRole, Record<LocaleCode, string>> = {
  Speaker: { ar: "متحدث", fr: "Intervenant", en: "Speaker" },
  Panelist: { ar: "عضو لجنة", fr: "Panéliste", en: "Panelist" },
  Host: { ar: "مضيف", fr: "Hôte", en: "Host" },
  Delegate: { ar: "مندوب", fr: "Délégué", en: "Delegate" },
  Rapporteur: { ar: "مقرر", fr: "Rapporteur", en: "Rapporteur" },
  Facilitator: { ar: "ميسر", fr: "Facilitateur", en: "Facilitator" },
  Coordinator: { ar: "منسق", fr: "Coordinateur", en: "Coordinator" },
  usher: { ar: "مضيف مراسم", fr: "Huissier", en: "Usher" },
  President: { ar: "رئيس", fr: "Président", en: "President" },
  Representative: { ar: "ممثل", fr: "Représentant", en: "Representative" },
  Ambassador: { ar: "سفير", fr: "Ambassadeur", en: "Ambassador" },
  Trainer: { ar: "مدرب", fr: "Formateur", en: "Trainer" },
  Member: { ar: "عضو", fr: "Membre", en: "Member" },
  Participant: { ar: "مشارك", fr: "Participant", en: "Participant" },
  Other: { ar: "أخرى", fr: "Autre", en: "Other" },
};

export function getParticipationRoleLabel(
  role: ParticipationRole,
  locale: LocaleCode,
  roleOtherAr: string | null,
  roleOtherFr: string | null,
  roleOtherEn: string | null,
) {
  if (role === "Other") {
    const fallback = ROLE_LABELS.Other[locale];
    if (locale === "ar") return roleOtherAr ?? fallback;
    if (locale === "fr") return roleOtherFr ?? fallback;
    return roleOtherEn && roleOtherEn.trim() !== "" ? roleOtherEn : (roleOtherFr ?? fallback);
  }

  return ROLE_LABELS[role][locale];
}

export type PastParticipation = {
  slug: string;
  titleAr: string;
  titleFr: string;
  titleEn: string | null;
  bodyAr: string | null;
  bodyFr: string | null;
  bodyEn: string | null;
  eventDate: string;
  eventEndDate: string | null;
  eventDateLabel: string;
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
  sourceUrl: string | null;
};

const PARTICIPATION_FIELDS =
  "slug,title_ar,title_fr,title_en,body_ar,body_fr,body_en,event_date,event_end_date,event_date_label,venue_ar,venue_fr,venue_en,institution_ar,institution_fr,institution_en,role,role_other_ar,role_other_fr,role_other_en,source_url";

type PastParticipationRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string | null;
  body_ar: string | null;
  body_fr: string | null;
  body_en: string | null;
  event_date: string;
  event_end_date: string | null;
  event_date_label: string;
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
  source_url: string | null;
};

function toPastParticipation(row: PastParticipationRow): PastParticipation {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    bodyEn: row.body_en,
    eventDate: row.event_date,
    eventEndDate: row.event_end_date,
    eventDateLabel: row.event_date_label,
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
    sourceUrl: row.source_url,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedPastParticipations(
  client?: SupabaseClient,
): Promise<PastParticipation[]> {
  const supabase = getClient(client);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("past_participation")
    .select(PARTICIPATION_FIELDS)
    .eq("status", "published")
    .order("event_date", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as PastParticipationRow[]).map(toPastParticipation);
}

export async function getPublishedPastParticipationBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<PastParticipation | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("past_participation")
    .select(PARTICIPATION_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toPastParticipation(data as PastParticipationRow) : null;
}

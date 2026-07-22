import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";
import type { LocaleCode } from "@/lib/i18n/locales";
import type { ParticipationRole } from "./participation-roles";

export { PARTICIPATION_ROLES, type ParticipationRole } from "./participation-roles";

const ROLE_LABELS: Record<ParticipationRole, Record<LocaleCode, string>> = {
  Speaker: { ar: "متحدث", fr: "Intervenant" },
  Panelist: { ar: "عضو لجنة", fr: "Panéliste" },
  Host: { ar: "مضيف", fr: "Hôte" },
  Delegate: { ar: "مندوب", fr: "Délégué" },
  Rapporteur: { ar: "مقرر", fr: "Rapporteur" },
  Facilitator: { ar: "ميسر", fr: "Facilitateur" },
  Coordinator: { ar: "منسق", fr: "Coordinateur" },
  usher: { ar: "مضيف مراسم", fr: "Huissier" },
  President: { ar: "رئيس", fr: "Président" },
  Representative: { ar: "ممثل", fr: "Représentant" },
  Ambassador: { ar: "سفير", fr: "Ambassadeur" },
  Trainer: { ar: "مدرب", fr: "Formateur" },
  Member: { ar: "عضو", fr: "Membre" },
  Participant: { ar: "مشارك", fr: "Participant" },
  Other: { ar: "أخرى", fr: "Autre" },
};

export function getParticipationRoleLabel(
  role: ParticipationRole,
  locale: LocaleCode,
  roleOtherAr: string | null,
  roleOtherFr: string | null,
) {
  if (role === "Other") {
    return locale === "ar" ? roleOtherAr ?? ROLE_LABELS.Other.ar : roleOtherFr ?? ROLE_LABELS.Other.fr;
  }

  return ROLE_LABELS[role][locale];
}

export type PastParticipation = {
  slug: string;
  titleAr: string;
  titleFr: string;
  bodyAr: string | null;
  bodyFr: string | null;
  eventDate: string;
  eventEndDate: string | null;
  eventDateLabel: string;
  venueAr: string;
  venueFr: string;
  institutionAr: string;
  institutionFr: string;
  role: ParticipationRole;
  roleOtherAr: string | null;
  roleOtherFr: string | null;
  sourceUrl: string | null;
};

const PARTICIPATION_FIELDS =
  "slug,title_ar,title_fr,body_ar,body_fr,event_date,event_end_date,event_date_label,venue_ar,venue_fr,institution_ar,institution_fr,role,role_other_ar,role_other_fr,source_url";

type PastParticipationRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string | null;
  body_fr: string | null;
  event_date: string;
  event_end_date: string | null;
  event_date_label: string;
  venue_ar: string;
  venue_fr: string;
  institution_ar: string;
  institution_fr: string;
  role: ParticipationRole;
  role_other_ar: string | null;
  role_other_fr: string | null;
  source_url: string | null;
};

function toPastParticipation(row: PastParticipationRow): PastParticipation {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    eventDate: row.event_date,
    eventEndDate: row.event_end_date,
    eventDateLabel: row.event_date_label,
    venueAr: row.venue_ar,
    venueFr: row.venue_fr,
    institutionAr: row.institution_ar,
    institutionFr: row.institution_fr,
    role: row.role,
    roleOtherAr: row.role_other_ar,
    roleOtherFr: row.role_other_fr,
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

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type EducationEntry = {
  slug: string;
  degreeAr: string;
  degreeFr: string;
  degreeEn: string | null;
  institutionAr: string;
  institutionFr: string;
  institutionEn: string | null;
  honoursAr: string | null;
  honoursFr: string | null;
  honoursEn: string | null;
  startDate: string;
  endDate: string | null;
  location: string;
};

const EDUCATION_FIELDS =
  "slug,degree_ar,degree_fr,degree_en,institution_ar,institution_fr,institution_en,honours_ar,honours_fr,honours_en,start_date,end_date,location";

type EducationEntryRow = {
  slug: string;
  degree_ar: string;
  degree_fr: string;
  degree_en: string | null;
  institution_ar: string;
  institution_fr: string;
  institution_en: string | null;
  honours_ar: string | null;
  honours_fr: string | null;
  honours_en: string | null;
  start_date: string;
  end_date: string | null;
  location: string;
};

function toEducationEntry(row: EducationEntryRow): EducationEntry {
  return {
    slug: row.slug,
    degreeAr: row.degree_ar,
    degreeFr: row.degree_fr,
    degreeEn: row.degree_en,
    institutionAr: row.institution_ar,
    institutionFr: row.institution_fr,
    institutionEn: row.institution_en,
    honoursAr: row.honours_ar,
    honoursFr: row.honours_fr,
    honoursEn: row.honours_en,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedEducationEntries(
  client?: SupabaseClient,
): Promise<EducationEntry[]> {
  const supabase = getClient(client);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("education_entry")
    .select(EDUCATION_FIELDS)
    .eq("status", "published")
    .order("start_date", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as EducationEntryRow[]).map(toEducationEntry);
}

export async function getPublishedEducationEntryBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<EducationEntry | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("education_entry")
    .select(EDUCATION_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toEducationEntry(data as EducationEntryRow) : null;
}

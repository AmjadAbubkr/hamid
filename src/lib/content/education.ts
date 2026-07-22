import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type EducationEntry = {
  slug: string;
  degreeAr: string;
  degreeFr: string;
  institutionAr: string;
  institutionFr: string;
  honoursAr: string | null;
  honoursFr: string | null;
  startDate: string;
  endDate: string | null;
  location: string;
};

const EDUCATION_FIELDS =
  "slug,degree_ar,degree_fr,institution_ar,institution_fr,honours_ar,honours_fr,start_date,end_date,location";

type EducationEntryRow = {
  slug: string;
  degree_ar: string;
  degree_fr: string;
  institution_ar: string;
  institution_fr: string;
  honours_ar: string | null;
  honours_fr: string | null;
  start_date: string;
  end_date: string | null;
  location: string;
};

function toEducationEntry(row: EducationEntryRow): EducationEntry {
  return {
    slug: row.slug,
    degreeAr: row.degree_ar,
    degreeFr: row.degree_fr,
    institutionAr: row.institution_ar,
    institutionFr: row.institution_fr,
    honoursAr: row.honours_ar,
    honoursFr: row.honours_fr,
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

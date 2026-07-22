import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type PositionHeld = {
  slug: string;
  titleAr: string;
  titleFr: string;
  bodyAr: string | null;
  bodyFr: string | null;
  institution: string;
  startDate: string;
  endDate: string | null;
  location: string;
};

const POSITION_FIELDS =
  "slug,title_ar,title_fr,body_ar,body_fr,institution,start_date,end_date,location";

type PositionHeldRow = {
  slug: string;
  title_ar: string;
  title_fr: string;
  body_ar: string | null;
  body_fr: string | null;
  institution: string;
  start_date: string;
  end_date: string | null;
  location: string;
};

function toPositionHeld(row: PositionHeldRow): PositionHeld {
  return {
    slug: row.slug,
    titleAr: row.title_ar,
    titleFr: row.title_fr,
    bodyAr: row.body_ar,
    bodyFr: row.body_fr,
    institution: row.institution,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
  };
}

function getClient(client?: SupabaseClient) {
  if (client) return client;

  // Local UI work should remain possible before Supabase configuration exists.
  // Configured deployments always use the anonymous client and its RLS policy.
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedPositions(
  client?: SupabaseClient,
): Promise<PositionHeld[]> {
  const supabase = getClient(client);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("position_held")
    .select(POSITION_FIELDS)
    .eq("status", "published")
    .order("start_date", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as PositionHeldRow[]).map(toPositionHeld);
}

export async function getPublishedPositionBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<PositionHeld | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("position_held")
    .select(POSITION_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toPositionHeld(data as PositionHeldRow) : null;
}

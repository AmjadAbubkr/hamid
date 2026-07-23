import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseClient,
  hasPublicSupabaseConfig,
} from "@/lib/supabase/public";

export type Tagline = {
  textAr: string;
  textFr: string;
};

type TaglineRow = {
  tagline_ar: string;
  tagline_fr: string;
};

function getClient(client?: SupabaseClient) {
  if (client) return client;
  return hasPublicSupabaseConfig() ? getPublicSupabaseClient() : null;
}

export async function getPublishedTagline(client?: SupabaseClient): Promise<Tagline | null> {
  const supabase = getClient(client);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tagline")
    .select("tagline_ar,tagline_fr")
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as TaglineRow;
  return { textAr: row.tagline_ar, textFr: row.tagline_fr };
}

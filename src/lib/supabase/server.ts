import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type ServerCookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
};

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing required Supabase public environment variables.");
  }

  return { url, anonKey };
}

export function createSupabaseServerClient(cookies: ServerCookieAdapter) {
  const { url, anonKey } = getPublicSupabaseConfig();
  return createServerClient(url, anonKey, {
    cookies,
    auth: {
      experimental: {
        passkey: true,
      },
    },
  });
}

export function getSupabaseAdminClient(): SupabaseClient {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing required server-only environment variable SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      experimental: {
        passkey: true,
      },
    },
  });
}

export async function getCurrentEditorId(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.rpc("current_editor_id");
  if (error) throw error;

  return typeof data === "string" ? data : null;
}

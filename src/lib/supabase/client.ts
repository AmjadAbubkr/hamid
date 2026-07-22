import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let cachedKey: string | null = null;

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing required environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Both must be set to initialize the Supabase client.",
    );
  }

  const key = `${supabaseUrl}|${supabaseAnonKey}`;
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      experimental: {
        passkey: true,
      },
    },
  });
  cachedKey = key;
  return cachedClient;
}

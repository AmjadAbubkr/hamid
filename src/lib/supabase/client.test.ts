import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns a SupabaseClient instance", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const { getSupabaseClient } = await import("./client");
    const client = getSupabaseClient();
    expect(client).toBeInstanceOf(Object);
    expect((client as unknown as { supabaseUrl: string }).supabaseUrl).toBe(
      "https://test-project.supabase.co",
    );
  });

  it("returns the same singleton reference on repeated calls", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const { getSupabaseClient } = await import("./client");
    const a = getSupabaseClient();
    const b = getSupabaseClient();
    expect(b).toBe(a);
  });

  it("reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://env-driven.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "env-anon-key");
    const { getSupabaseClient } = await import("./client");
    const client: SupabaseClient = getSupabaseClient();
    expect((client as unknown as { supabaseUrl: string }).supabaseUrl).toBe(
      "https://env-driven.supabase.co",
    );
    expect((client as unknown as { supabaseKey: string }).supabaseKey).toBe(
      "env-anon-key",
    );
  });

  it("invalidates cache when env vars change", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://first.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "first-key");
    const { getSupabaseClient } = await import("./client");
    const first = getSupabaseClient();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://second.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "second-key");
    const second = getSupabaseClient();

    expect(second).not.toBe(first);
    expect((second as unknown as { supabaseUrl: string }).supabaseUrl).toBe(
      "https://second.supabase.co",
    );
  });

  it("throws a clear error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "some-key");
    const { getSupabaseClient } = await import("./client");
    expect(() => getSupabaseClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY.*NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("throws a clear error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://some.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { getSupabaseClient } = await import("./client");
    expect(() => getSupabaseClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY.*NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});

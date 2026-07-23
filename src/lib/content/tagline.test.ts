import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublishedTagline } from "./tagline";

describe("public Tagline query", () => {
  it("returns the singleton only when it is published", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { tagline_ar: "سطر تعريفي", tagline_fr: "Une phrase de présentation" },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getPublishedTagline(client)).resolves.toEqual({
      textAr: "سطر تعريفي",
      textFr: "Une phrase de présentation",
    });

    expect(client.from).toHaveBeenCalledWith("tagline");
    expect(eq).toHaveBeenCalledWith("status", "published");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { galleryPublicUrl, getPublishedGalleryPhotos } from "./gallery";

describe("public Gallery queries", () => {
  it("requests only published photos in display order", async () => {
    const secondOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder });
    const eq = vi.fn().mockReturnValue({ order: firstOrder });
    const select = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getPublishedGalleryPhotos(client)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(firstOrder).toHaveBeenCalledWith("taken_date", { ascending: false, nullsFirst: false });
    expect(secondOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("builds a public-bucket URL without exposing staging paths", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co/";

    expect(galleryPublicUrl("editor/photo 1.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/gallery-public/editor/photo%201.jpg",
    );

    if (original === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("passes through local /imgs paths without a Supabase origin", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(galleryPublicUrl("/imgs/hamid3gal.jpg")).toBe("/imgs/hamid3gal.jpg");
    expect(galleryPublicUrl("")).toBe(null);
  });
});

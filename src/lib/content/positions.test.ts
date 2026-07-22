import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublishedPositionBySlug,
  getPublishedPositions,
} from "./positions";

const publishedRow = {
  slug: "inspecteur-technique",
  title_ar: "مفتش تقني",
  title_fr: "Inspecteur technique",
  body_ar: "ملخص",
  body_fr: "Résumé",
  institution: "Ministère de la Communication",
  start_date: "2026-05-22",
  end_date: null,
  location: "N'Djamena, Tchad",
};

describe("public Position Held queries", () => {
  it("requests only published rows, ordered newest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [publishedRow], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    await expect(getPublishedPositions(client)).resolves.toEqual([
      {
        slug: "inspecteur-technique",
        titleAr: "مفتش تقني",
        titleFr: "Inspecteur technique",
        bodyAr: "ملخص",
        bodyFr: "Résumé",
        institution: "Ministère de la Communication",
        startDate: "2026-05-22",
        endDate: null,
        location: "N'Djamena, Tchad",
      },
    ]);

    expect(from).toHaveBeenCalledWith("position_held");
    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(order).toHaveBeenCalledWith("start_date", { ascending: false });
  });

  it("looks up a detail row through the published filter and treats no row as absent", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const slugFilter = vi.fn().mockReturnValue({ maybeSingle });
    const statusFilter = vi.fn().mockReturnValue({ eq: slugFilter });
    const select = vi.fn().mockReturnValue({ eq: statusFilter });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(
      getPublishedPositionBySlug("unpublished-position", client),
    ).resolves.toBeNull();

    expect(statusFilter).toHaveBeenCalledWith("status", "published");
    expect(slugFilter).toHaveBeenCalledWith("slug", "unpublished-position");
    expect(maybeSingle).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublishedPastParticipationBySlug,
  getPublishedPastParticipations,
} from "./participations";

describe("public Past Participation queries", () => {
  it("requests only published rows, most recent event first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(getPublishedPastParticipations(client)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(order).toHaveBeenCalledWith("event_date", { ascending: false });
  });

  it("uses the published filter for the deep detail lookup", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const slugFilter = vi.fn().mockReturnValue({ maybeSingle });
    const statusFilter = vi.fn().mockReturnValue({ eq: slugFilter });
    const select = vi.fn().mockReturnValue({ eq: statusFilter });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(
      getPublishedPastParticipationBySlug("draft-appearance", client),
    ).resolves.toBeNull();

    expect(statusFilter).toHaveBeenCalledWith("status", "published");
    expect(slugFilter).toHaveBeenCalledWith("slug", "draft-appearance");
  });
});

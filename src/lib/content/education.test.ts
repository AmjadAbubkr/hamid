import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublishedEducationEntries,
  getPublishedEducationEntryBySlug,
} from "./education";

describe("public Education Entry queries", () => {
  it("requests only published Education Entries ordered by start date", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(getPublishedEducationEntries(client)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(order).toHaveBeenCalledWith("start_date", { ascending: false });
  });

  it("looks up an Education Entry through the published filter", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const slugFilter = vi.fn().mockReturnValue({ maybeSingle });
    const statusFilter = vi.fn().mockReturnValue({ eq: slugFilter });
    const select = vi.fn().mockReturnValue({ eq: statusFilter });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(
      getPublishedEducationEntryBySlug("draft-degree", client),
    ).resolves.toBeNull();

    expect(statusFilter).toHaveBeenCalledWith("status", "published");
    expect(slugFilter).toHaveBeenCalledWith("slug", "draft-degree");
  });
});

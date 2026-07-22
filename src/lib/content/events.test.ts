import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPublishedUpcomingEventBySlug,
  getPublishedUpcomingEvents,
} from "./events";

describe("public Upcoming Event queries", () => {
  it("requests only published non-expired events in chronological order", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const gte = vi.fn().mockReturnValue({ order });
    const eq = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getPublishedUpcomingEvents(client)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(gte).toHaveBeenCalledWith("event_date", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(order).toHaveBeenCalledWith("event_date", { ascending: true });
  });

  it("uses the published and non-expired filters for the detail lookup", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const slugFilter = vi.fn().mockReturnValue({ maybeSingle });
    const dateFilter = vi.fn().mockReturnValue({ eq: slugFilter });
    const statusFilter = vi.fn().mockReturnValue({ gte: dateFilter });
    const select = vi.fn().mockReturnValue({ eq: statusFilter });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getPublishedUpcomingEventBySlug("draft-event", client)).resolves.toBeNull();

    expect(statusFilter).toHaveBeenCalledWith("status", "published");
    expect(dateFilter).toHaveBeenCalledWith("event_date", expect.any(String));
    expect(slugFilter).toHaveBeenCalledWith("slug", "draft-event");
  });

  it("uses newest-first order for the complete Events listing", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const gte = vi.fn().mockReturnValue({ order });
    const eq = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient;

    await expect(getPublishedUpcomingEvents(client, "descending")).resolves.toEqual([]);

    expect(order).toHaveBeenCalledWith("event_date", { ascending: false });
  });
});

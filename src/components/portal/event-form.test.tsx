// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

import { EventForm } from "./event-form";

describe("EventForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves an incomplete draft for the current Editor without silently assigning a role", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "event-id", slug: "draft-event", status: "draft" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.from.mockReturnValue({ insert });
    mocks.rpc.mockResolvedValue({ data: "editor-id", error: null });

    render(<EventForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "draft-event" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      slug: "draft-event",
      role: null,
      role_other_ar: null,
      role_other_fr: null,
      role_other_en: null,
      status: "draft",
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/portal/events/draft-event");
  });

  it("requires an explicit role and paired Other-role details before Publish is enabled", () => {
    render(<EventForm event={{ id: "event-id", slug: "draft-event", status: "draft" }} />);

    const publish = screen.getByRole("button", { name: "Publish" });
    fireEvent.change(screen.getByLabelText("Arabic title"), { target: { value: "Arabic title" } });
    fireEvent.change(screen.getByLabelText("French title"), { target: { value: "French title" } });
    fireEvent.change(screen.getByLabelText("Arabic venue"), { target: { value: "Arabic venue" } });
    fireEvent.change(screen.getByLabelText("French venue"), { target: { value: "French venue" } });
    fireEvent.change(screen.getByLabelText("Arabic institution"), { target: { value: "Arabic institution" } });
    fireEvent.change(screen.getByLabelText("French institution"), { target: { value: "French institution" } });
    fireEvent.change(screen.getByLabelText("English title"), { target: { value: "English title" } });
    fireEvent.change(screen.getByLabelText("English venue"), { target: { value: "English venue" } });
    fireEvent.change(screen.getByLabelText("English institution"), { target: { value: "English institution" } });
    fireEvent.change(screen.getByLabelText("Event date"), { target: { value: "2026-08-01" } });

    expect(publish).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Other" } });
    expect(publish).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Arabic other role"), { target: { value: "Custom role" } });
    fireEvent.change(screen.getByLabelText("French other role"), { target: { value: "Custom role" } });
    fireEvent.change(screen.getByLabelText("English other role"), { target: { value: "Custom role" } });
    expect(publish).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Arabic announcement"), { target: { value: "Only one language" } });
    expect(publish).toBeDisabled();
  });

  it("publishes using the upcoming_event type", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("Cannot publish: French venue is empty.") });
    render(<EventForm event={{
      id: "event-id",
      slug: "draft-event",
      status: "draft",
      title_ar: "Arabic title",
      title_fr: "French title",
      venue_ar: "Arabic venue",
      venue_fr: "French venue",
      institution_ar: "Arabic institution",
      institution_fr: "French institution",
      title_en: "English title",
      venue_en: "English venue",
      institution_en: "English institution",
      event_date: "2026-08-01",
      role: "Speaker",
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot publish: French venue is empty.");
    expect(mocks.rpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "upcoming_event",
      item_id: "event-id",
    });
  });

  it("keeps published upcoming events editable", () => {
    render(<EventForm event={{ id: "event-id", slug: "published-event", status: "published" }} />);

    expect(screen.getByText("This event is public and remains editable until it is archived after its date.")).toBeInTheDocument();
    expect(screen.getByLabelText("URL slug")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });
});

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

import { ParticipationForm } from "./participation-form";

describe("ParticipationForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves an incomplete draft for the current Editor", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "participation-id", slug: "draft-participation", status: "draft" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.from.mockReturnValue({ insert });
    mocks.rpc.mockResolvedValue({ data: "editor-id", error: null });

    render(<ParticipationForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "draft-participation" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      slug: "draft-participation",
      title_ar: "",
      title_fr: "",
      title_en: "",
      role: null,
      role_other_ar: null,
      role_other_fr: null,
      role_other_en: null,
      status: "draft",
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/portal/participations/draft-participation");
  });

  it("requires paired Other-role details before Publish is enabled", () => {
    render(<ParticipationForm participation={{ id: "participation-id", slug: "draft-participation", status: "draft" }} />);

    fireEvent.change(screen.getByLabelText("Arabic title"), { target: { value: "مؤتمر" } });
    fireEvent.change(screen.getByLabelText("French title"), { target: { value: "Conférence" } });
    fireEvent.change(screen.getByLabelText("Arabic venue"), { target: { value: "انجامينا" } });
    fireEvent.change(screen.getByLabelText("French venue"), { target: { value: "N'Djamena" } });
    fireEvent.change(screen.getByLabelText("Arabic institution"), { target: { value: "مؤسسة" } });
    fireEvent.change(screen.getByLabelText("French institution"), { target: { value: "Institution" } });
    fireEvent.change(screen.getByLabelText("English title"), { target: { value: "Conference" } });
    fireEvent.change(screen.getByLabelText("Sortable event date"), { target: { value: "2023-01-17" } });
    fireEvent.change(screen.getByLabelText("English venue"), { target: { value: "N'Djamena" } });
    fireEvent.change(screen.getByLabelText("English institution"), { target: { value: "Institution" } });
    fireEvent.change(screen.getByLabelText("Published date label"), { target: { value: "17-19 January 2023" } });
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Other" } });

    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Arabic other role"), { target: { value: "دور خاص" } });
    fireEvent.change(screen.getByLabelText("French other role"), { target: { value: "Rôle spécial" } });
    fireEvent.change(screen.getByLabelText("English other role"), { target: { value: "Special role" } });
    expect(publish).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Arabic summary"), { target: { value: "ملخص" } });
    expect(publish).toBeDisabled();
  });

  it("shows the database publish error in plain language", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("Cannot publish: French venue is empty.") });
    render(<ParticipationForm participation={{
      id: "participation-id",
      slug: "draft-participation",
      status: "draft",
      title_ar: "مؤتمر",
      title_fr: "Conférence",
      venue_ar: "انجامينا",
      venue_fr: "N'Djamena",
      institution_ar: "مؤسسة",
      institution_fr: "Institution",
      role: "Speaker",
      title_en: "Conference",
      venue_en: "N'Djamena",
      institution_en: "Institution",
      event_date: "2023-01-17",
      event_date_label: "17 January 2023",
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot publish: French venue is empty.");
    expect(mocks.rpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "past_participation",
      item_id: "participation-id",
    });
  });

  it("makes published historical records read-only", () => {
    render(<ParticipationForm participation={{
      id: "participation-id",
      slug: "published-participation",
      status: "published",
    }} />);

    expect(screen.getByText("Published Past Participations are immutable historical records.")).toBeInTheDocument();
    expect(screen.getByLabelText("URL slug")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save as draft" })).toBeDisabled();
  });
});

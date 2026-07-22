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

import { PositionForm } from "./position-form";

describe("PositionForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves an incomplete bilingual draft for the current Editor", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "position-id", slug: "draft-position", status: "draft" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.from.mockReturnValue({ insert });
    mocks.rpc.mockResolvedValue({ data: "editor-id", error: null });

    render(<PositionForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "draft-position" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      slug: "draft-position",
      title_ar: "",
      title_fr: "",
      status: "draft",
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/portal/positions/draft-position");
  });

  it("keeps Publish disabled until the paired and type-specific requirements are complete", () => {
    render(<PositionForm position={{ id: "position-id", slug: "draft-position", status: "draft" }} />);

    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Arabic title"), { target: { value: "مفتش" } });
    fireEvent.change(screen.getByLabelText("French title"), { target: { value: "Inspecteur" } });
    fireEvent.change(screen.getByLabelText("Institution"), { target: { value: "Ministère" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-05-22" } });
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "N'Djamena" } });
    expect(publish).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Arabic summary"), { target: { value: "ملخص" } });
    expect(publish).toBeDisabled();
  });

  it("shows the database publish error in plain language", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("Cannot publish: French title is empty.") });
    render(<PositionForm position={{
      id: "position-id",
      slug: "draft-position",
      status: "draft",
      title_ar: "مفتش",
      title_fr: "Inspecteur",
      institution: "Ministère",
      start_date: "2026-05-22",
      location: "N'Djamena",
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot publish: French title is empty.");
    expect(mocks.rpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "position_held",
      item_id: "position-id",
    });
  });
});

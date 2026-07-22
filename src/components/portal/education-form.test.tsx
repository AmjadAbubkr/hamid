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

import { EducationForm } from "./education-form";

describe("EducationForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("saves an incomplete bilingual draft for the current Editor", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "education-id", slug: "draft-education", status: "draft" },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mocks.from.mockReturnValue({ insert });
    mocks.rpc.mockResolvedValue({ data: "editor-id", error: null });

    render(<EducationForm />);
    fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "draft-education" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      author_editor_id: "editor-id",
      slug: "draft-education",
      degree_ar: "",
      degree_fr: "",
      institution_ar: "",
      institution_fr: "",
      status: "draft",
    }));
    expect(mocks.replace).toHaveBeenCalledWith("/portal/education/draft-education");
  });

  it("keeps Publish disabled until all required paired and shared fields are complete", () => {
    render(<EducationForm education={{ id: "education-id", slug: "draft-education", status: "draft" }} />);

    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Arabic degree"), { target: { value: "ماجستير" } });
    fireEvent.change(screen.getByLabelText("French degree"), { target: { value: "Master" } });
    fireEvent.change(screen.getByLabelText("Arabic institution"), { target: { value: "جامعة" } });
    fireEvent.change(screen.getByLabelText("French institution"), { target: { value: "Université" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2018-01-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2019-01-01" } });
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Yaoundé" } });
    expect(publish).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Arabic honours"), { target: { value: "بامتياز" } });
    expect(publish).toBeDisabled();
  });

  it("shows the database publish error in plain language", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("Cannot publish: French degree is empty.") });
    render(<EducationForm education={{
      id: "education-id",
      slug: "draft-education",
      status: "draft",
      degree_ar: "ماجستير",
      degree_fr: "Master",
      institution_ar: "جامعة",
      institution_fr: "Université",
      start_date: "2018-01-01",
      end_date: "2019-01-01",
      location: "Yaoundé",
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot publish: French degree is empty.");
    expect(mocks.rpc).toHaveBeenCalledWith("publish_content_item", {
      item_type: "education_entry",
      item_id: "education-id",
    });
  });
});

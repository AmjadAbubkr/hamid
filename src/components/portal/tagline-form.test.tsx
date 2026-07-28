// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { TaglineForm } from "./tagline-form";

describe("TaglineForm", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads the one protected record and prevents an incomplete three-locale publish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      tagline: { id: "tagline-id", status: "draft", tagline_ar: "سطر", tagline_fr: "" },
    }), { status: 200 })));

    render(<TaglineForm />);

    expect(await screen.findByLabelText("Arabic Tagline")).toHaveValue("سطر");
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByText(/no New, list, or delete action/i)).toBeInTheDocument();
  });

  it("uses the protected API to save the singleton as a Draft", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        tagline: { id: "tagline-id", status: "draft", tagline_ar: "", tagline_fr: "" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        tagline: { id: "tagline-id", status: "draft", tagline_ar: "سطر", tagline_fr: "Une phrase" },
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TaglineForm />);
    fireEvent.change(await screen.findByLabelText("Arabic Tagline"), { target: { value: "سطر" } });
    fireEvent.change(screen.getByLabelText("French Tagline"), { target: { value: "Une phrase" } });
    fireEvent.change(screen.getByLabelText("English Tagline"), { target: { value: "A sentence" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/portal/tagline", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"action":"save"'),
    }));
  });
});

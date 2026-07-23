// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GalleryGrid } from "./gallery-grid";

const photos = [
  { id: "one", src: "https://example.com/one.jpg", caption: "First image", category: null, takenDate: null, photographerCredit: null },
  { id: "two", src: "https://example.com/two.jpg", caption: "Second image", category: null, takenDate: null, photographerCredit: null },
];

describe("GalleryGrid", () => {
  it("opens a lightbox, cycles with arrows, and closes with Escape or its backdrop", () => {
    render(<GalleryGrid photos={photos} emptyLabel="No photos" />);

    fireEvent.click(screen.getByRole("button", { name: "First image" }));
    expect(screen.getByRole("dialog", { name: "First image" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Second image" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

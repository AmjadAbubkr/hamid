import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Libre_Caslon_Text: () => ({ variable: "font-display" }),
  Source_Sans_3: () => ({ variable: "font-body" }),
  Noto_Naskh_Arabic: () => ({ variable: "font-naskh" }),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("provides the required html and body document shell", () => {
    const children = <main>Portal</main>;
    const documentShell = RootLayout({ children });
    const body = documentShell.props.children;

    expect(documentShell.type).toBe("html");
    expect(body.type).toBe("body");
    expect(body.props.children).toBe(children);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

const pathnameMock = vi.fn(() => "/ar");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

import { LocaleDocumentDirector } from "@/components/locale-document-director";
import { LOCALE_META } from "@/lib/i18n/locales";

describe("LocaleDocumentDirector", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    const html = document.documentElement;
    html.removeAttribute("dir");
    html.removeAttribute("lang");
  });

  it("sets <html dir='rtl' lang='ar'> when the pathname is /ar", () => {
    pathnameMock.mockReturnValue("/ar");
    render(<LocaleDocumentDirector />);
    const html = document.documentElement;
    expect(html.getAttribute("dir")).toBe(LOCALE_META.ar.dir);
    expect(html.getAttribute("lang")).toBe(LOCALE_META.ar.htmlLang);
    cleanup();
  });

  it("sets <html dir='ltr' lang='fr'> when the pathname is /fr", () => {
    pathnameMock.mockReturnValue("/fr");
    render(<LocaleDocumentDirector />);
    const html = document.documentElement;
    expect(html.getAttribute("dir")).toBe(LOCALE_META.fr.dir);
    expect(html.getAttribute("lang")).toBe(LOCALE_META.fr.htmlLang);
    cleanup();
  });

  it("sets <html dir='ltr' lang='en'> when the pathname is /en", () => {
    pathnameMock.mockReturnValue("/en");
    render(<LocaleDocumentDirector />);
    const html = document.documentElement;
    expect(html.getAttribute("dir")).toBe(LOCALE_META.en.dir);
    expect(html.getAttribute("lang")).toBe(LOCALE_META.en.htmlLang);
    cleanup();
  });

  it("falls back to the default Locale (ar → rtl) when the pathname has no Locale segment", () => {
    pathnameMock.mockReturnValue("/");
    render(<LocaleDocumentDirector />);
    const html = document.documentElement;
    expect(html.getAttribute("dir")).toBe("rtl");
    expect(html.getAttribute("lang")).toBe("ar");
    cleanup();
  });

  it("falls back to the default Locale when the path segment is an unknown Locale", () => {
    pathnameMock.mockReturnValue("/xx/something");
    render(<LocaleDocumentDirector />);
    const html = document.documentElement;
    expect(html.getAttribute("dir")).toBe("rtl");
    expect(html.getAttribute("lang")).toBe("ar");
    cleanup();
  });
});

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_META, isLocaleCode } from "@/lib/i18n/locales";

export function LocaleDocumentDirector() {
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const locale = isLocaleCode(firstSegment) ? firstSegment : DEFAULT_LOCALE;
  const { dir, htmlLang } = LOCALE_META[locale];

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", htmlLang);
  }, [dir, htmlLang]);

  return null;
}

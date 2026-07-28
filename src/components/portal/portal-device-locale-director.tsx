"use client";

import { useEffect } from "react";
import { LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";

function localeFromDevice(language: string | undefined): LocaleCode {
  if (language?.toLowerCase().startsWith("ar")) return "ar";
  if (language?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

export function PortalDeviceLocaleDirector() {
  useEffect(() => {
    const locale = localeFromDevice(navigator.language);
    const { dir, htmlLang } = LOCALE_META[locale];
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", htmlLang);
  }, []);

  return null;
}

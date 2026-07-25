"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";

export function localePathFor(pathname: string | null, locale: LocaleCode) {
  if (!pathname || pathname === "/") return `/${locale}`;

  if (/^\/(ar|fr)(?:\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(ar|fr)(?=\/|$)/, `/${locale}`);
  }

  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function LocaleSwitcher({ locale }: { locale: LocaleCode }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Choose language" className="flex items-center gap-1 rounded-md border border-gold bg-surface p-1">
      {(["ar", "fr"] as const).map((targetLocale) => {
        const active = targetLocale === locale;

        return (
          <Link
            key={targetLocale}
            href={localePathFor(pathname, targetLocale)}
            lang={LOCALE_META[targetLocale].htmlLang}
            hrefLang={LOCALE_META[targetLocale].htmlLang}
            aria-current={active ? "page" : undefined}
            className={`rounded-sm px-2.5 py-1.5 text-xs font-bold tracking-wide transition-colors ${
              active
                ? "bg-gold text-navy"
                : "text-ink hover:bg-gold-200/20"
            }`}
          >
            {LOCALE_META[targetLocale].name}
          </Link>
        );
      })}
    </nav>
  );
}

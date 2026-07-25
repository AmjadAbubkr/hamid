"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_META, LOCALES, type LocaleCode } from "@/lib/i18n/locales";

export function localePathFor(pathname: string | null, locale: LocaleCode) {
  if (!pathname || pathname === "/") return `/${locale}`;

  // Build a regex of every supported Locale segment so swapping extends
  // automatically when LOCALES gains a new entry. The lookahead `(?=\/|$)`
  // ensures we only replace the path's first segment when it is exactly a
  // Locale code, never a deeper path that happens to start with one.
  const localeAlternation = LOCALES.join("|");
  const localeSegment = new RegExp(`^\\/(${localeAlternation})(?=\\/|$)`);

  if (localeSegment.test(pathname)) {
    return pathname.replace(localeSegment, `/${locale}`);
  }

  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function LocaleSwitcher({ locale }: { locale: LocaleCode }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Choose language" className="flex items-center gap-1 rounded-md border border-gold bg-surface p-1">
      {LOCALES.map((targetLocale) => {
        const active = targetLocale === locale;

        return (
          <Link
            key={targetLocale}
            href={localePathFor(pathname, targetLocale)}
            lang={LOCALE_META[targetLocale].htmlLang}
            hrefLang={LOCALE_META[targetLocale].htmlLang}
            aria-label={LOCALE_META[targetLocale].name}
            aria-current={active ? "page" : undefined}
            className={`rounded-sm px-2.5 py-1.5 text-xs font-bold tracking-wide transition-colors ${
              active
                ? "bg-gold text-navy"
                : "text-ink hover:bg-gold-200/20"
            }`}
          >
            {targetLocale}
          </Link>
        );
      })}
    </nav>
  );
}

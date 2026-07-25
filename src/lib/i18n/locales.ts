export type LocaleCode = "ar" | "fr" | "en";

export const LOCALES: LocaleCode[] = ["ar", "fr", "en"];

export const LOCALE_META: Record<
  LocaleCode,
  { name: string; dir: "rtl" | "ltr"; htmlLang: string }
> = {
  ar: { name: "العربية", dir: "rtl", htmlLang: "ar" },
  fr: { name: "Français", dir: "ltr", htmlLang: "fr" },
  en: { name: "English", dir: "ltr", htmlLang: "en" },
};

export const DEFAULT_LOCALE: LocaleCode = "ar";

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALES as string[]).includes(value);
}

/*
  textFor — pick the localized string for a Locale from a {ar, fr, en} bag.
  Replaces the per-page `locale === "ar" ? ... : ...` ternaries with a single
  helper so every page reads `textFor(locale, { ar: "...", fr: "...", en: "..." })`.
  The bag's missing-key default is `null`/`undefined` to make unlocalized rows
  visible at runtime instead of silently falling back to the wrong Locale.
*/
export function textFor<T>(
  locale: LocaleCode,
  values: { ar: T; fr: T; en: T },
): T {
  return values[locale];
}

/*
  localizedField — pick the (ar|fr|en) value from a paired triple. Overloaded
  for the two call shapes the project uses:

  - All-three-string (caption, tagline, etc.): the strict-paired columns that
    ADR-0003 + 0011 keep non-empty for published rows.
  - Nullable-rows (body, honours, role_other, photographer_credit, category,
    published_in_name): legacy paired columns that may legitimately be null.

  When the visitor's Locale is `en` but the row's `en` column is null or
  empty (the legacy backfill state between migration 013 running and the
  editor having filled English on every published row), the helper falls
  back to French so the page never renders a blank — ADR-0011 documents this
  as a transitional behaviour only; once migration 014 enforces the gate the
  fallback becomes unreachable for published rows.
*/
export function localizedField(
  locale: LocaleCode,
  ar: string,
  fr: string,
  en: string | null,
): string;
export function localizedField(
  locale: LocaleCode,
  ar: string | null,
  fr: string | null,
  en: string | null,
): string | null;
export function localizedField(
  locale: LocaleCode,
  ar: string | null,
  fr: string | null,
  en: string | null,
): string | null {
  if (locale === "ar") return ar;
  if (locale === "fr") return fr;
  if (locale === "en") return en && en.trim() !== "" ? en : fr;
  return fr;
}

/*
  intlLocaleFor — map a site LocaleCode to an Intl/Locale tag for date
  formatting. `ar` is mapped to `ar-TD` (Chadian Arabic) and `fr` to `fr-TD`
  to match the original bilingual formatting; `en` is mapped to `en-GB` (the
  diplomatic/press English default — UK date formatting, not US, to match
  institutional convention across the rest of the site).
*/
export function intlLocaleFor(locale: LocaleCode): string {
  if (locale === "ar") return "ar-TD";
  if (locale === "fr") return "fr-TD";
  return "en-GB";
}

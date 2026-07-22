export type LocaleCode = "ar" | "fr";

export const LOCALES: LocaleCode[] = ["ar", "fr"];

export const LOCALE_META: Record<
  LocaleCode,
  { name: string; dir: "rtl" | "ltr"; htmlLang: string }
> = {
  ar: { name: "العربية", dir: "rtl", htmlLang: "ar" },
  fr: { name: "Français", dir: "ltr", htmlLang: "fr" },
};

export const DEFAULT_LOCALE: LocaleCode = "ar";

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALES as string[]).includes(value);
}

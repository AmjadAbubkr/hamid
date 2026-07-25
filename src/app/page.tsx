import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleCode,
  isLocaleCode,
} from "@/lib/i18n/locales";

/*
  Root route — language-detector entrance. Reads the inbound Accept-Language
  header (per ADR-0011) and redirects the visitor to the best-matching Locale
  segment (`/ar`, `/fr`, or `/en`). Once a visitor lands on `/<locale>/…`
  the Locale is URL-encoded and no cookie is set (per issue 10 of the
  planning tracker — "the locale encoding lives entirely in the URL, no JS
  cookies"). The default for an unspecified or unparseable Accept-Language is
  `ar` (matching DEFAULT_LOCALE).

  The detector is Horde-rank naive: it parses `q=` weights, scores primary
  tags (so `en-US` matches `en`, `fr-FR` matches `fr`), and treats `*` as a
  perfect match for the default. It accepts only Locales we publish.
*/
export default async function RootPage() {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language") ?? "";
  const locale = detectLocaleFromAcceptLanguage(acceptLanguage);
  redirect(`/${locale}`);
}

export function detectLocaleFromAcceptLanguage(
  acceptLanguage: string,
): LocaleCode {
  if (!acceptLanguage.trim()) return DEFAULT_LOCALE;

  // Parse "fr-FR,fr;q=0.9,en;q=0.8" into [{tag:"fr-fr",q:0.9},{tag:"fr",q:0.9},...]
  const scored: Array<{ tag: string; q: number }> = [];
  for (const part of acceptLanguage.split(",")) {
    const [tagRaw, ...params] = part.trim().split(";");
    if (!tagRaw) continue;
    const tag = tagRaw.toLowerCase();
    let q = 1;
    for (const param of params) {
      const [k, v] = param.trim().split("=");
      if (k === "q" && typeof v === "string") {
        const parsed = Number.parseFloat(v);
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    if (q <= 0) continue;
    scored.push({ tag, q });
  }
  scored.sort((a, b) => b.q - a.q);

  for (const { tag } of scored) {
    if (tag === "*") return DEFAULT_LOCALE;
    // Exact tag match (e.g. "ar", "fr", "en")
    if (isLocaleCode(tag)) return tag;
    // Primary subtag match (e.g. "ar-td" -> "ar", "en-us" -> "en")
    const primary = tag.split("-")[0];
    if (primary && (LOCALES as string[]).includes(primary)) {
      return primary as LocaleCode;
    }
  }

  return DEFAULT_LOCALE;
}

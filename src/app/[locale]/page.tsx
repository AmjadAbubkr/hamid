import { notFound } from "next/navigation";
import { isLocaleCode, LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";
import { STRINGS } from "@/lib/i18n/strings";
import { DemoCard } from "@/components/demo-card";
import Link from "next/link";

type Params = { params: Promise<{ locale: string }> };

export default async function LocalePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) {
    notFound();
  }
  const locale: LocaleCode = rawLocale;
  const s = STRINGS[locale];
  const otherLocale: LocaleCode = locale === "ar" ? "fr" : "ar";

  return (
    <main
      className="ps-6 pe-6 ms-0 me-0 mx-auto w-full max-w-3xl flex-1 flex flex-col gap-8 py-12"
    >
      <header className="text-start flex flex-col gap-2">
        <h1 className="text-start text-3xl font-semibold tracking-tight text-zinc-900">
          {s.siteHeading}
        </h1>
        <p className="text-start text-sm text-zinc-500">
          {s.siteTagline} · {LOCALE_META[locale].name} · dir={LOCALE_META[locale].dir}
        </p>
      </header>

      <DemoCard locale={locale} />

      <nav className="text-start">
        <Link
          href={`/${otherLocale}`}
          className="inline-block ps-3 pe-3 ms-1 me-1 py-2 text-start rounded-s-md rounded-e-md bg-zinc-900 text-zinc-50 text-sm font-medium"
        >
          {s.switchPrompt}
        </Link>
      </nav>
    </main>
  );
}

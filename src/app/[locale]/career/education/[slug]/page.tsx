import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getPublishedEducationEntries,
  getPublishedEducationEntryBySlug,
} from "@/lib/content/education";
import { isLocaleCode, LOCALES, type LocaleCode } from "@/lib/i18n/locales";

type EducationDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const entries = await getPublishedEducationEntries();

  return LOCALES.flatMap((locale) =>
    entries.map((entry) => ({ locale, slug: entry.slug })),
  );
}

function formatDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function EducationDetailPage({
  params,
}: EducationDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const entry = await getPublishedEducationEntryBySlug(slug);
  if (!entry) notFound();

  const degree = locale === "ar" ? entry.degreeAr : entry.degreeFr;
  const institution = locale === "ar" ? entry.institutionAr : entry.institutionFr;
  const honours = locale === "ar" ? entry.honoursAr : entry.honoursFr;
  const present = locale === "ar" ? "حتى الآن" : "Aujourd’hui";
  const endDate = entry.endDate ? formatDate(entry.endDate, locale) : present;

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <article className="flex flex-col gap-5">
          <p className="text-sm text-zinc-500">
            {formatDate(entry.startDate, locale)} — {endDate}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {degree}
          </h1>
          <dl className="grid gap-3 text-zinc-700">
            <div>
              <dt className="text-sm text-zinc-500">
                {locale === "ar" ? "المؤسسة" : "Institution"}
              </dt>
              <dd>{institution}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">
                {locale === "ar" ? "الموقع" : "Lieu"}
              </dt>
              <dd>{entry.location}</dd>
            </div>
          </dl>
          {honours ? (
            <p className="leading-relaxed text-zinc-700">{honours}</p>
          ) : null}
        </article>
      </main>
      <CanonicalFooter pathname={`/${locale}/career/education/${entry.slug}`} />
    </>
  );
}

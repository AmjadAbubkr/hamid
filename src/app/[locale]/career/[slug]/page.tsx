import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getPublishedPositionBySlug,
  getPublishedPositions,
} from "@/lib/content/positions";
import { isLocaleCode, LOCALES, type LocaleCode } from "@/lib/i18n/locales";

type PositionDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const positions = await getPublishedPositions();

  return LOCALES.flatMap((locale) =>
    positions.map((position) => ({ locale, slug: position.slug })),
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

export default async function PositionDetailPage({
  params,
}: PositionDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const position = await getPublishedPositionBySlug(slug);
  if (!position) notFound();

  const title = locale === "ar" ? position.titleAr : position.titleFr;
  const body = locale === "ar" ? position.bodyAr : position.bodyFr;
  const present = locale === "ar" ? "حتى الآن" : "Aujourd’hui";
  const endDate = position.endDate
    ? formatDate(position.endDate, locale)
    : present;

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <article className="flex flex-col gap-5">
          <p className="text-sm text-zinc-500">
            {formatDate(position.startDate, locale)} — {endDate}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <dl className="grid gap-3 text-zinc-700">
            <div>
              <dt className="text-sm text-zinc-500">
                {locale === "ar" ? "المؤسسة" : "Institution"}
              </dt>
              <dd>{position.institution}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">
                {locale === "ar" ? "الموقع" : "Lieu"}
              </dt>
              <dd>{position.location}</dd>
            </div>
          </dl>
          {body ? <p className="leading-relaxed text-zinc-700">{body}</p> : null}
        </article>
      </main>
      <CanonicalFooter pathname={`/${locale}/career/${position.slug}`} />
    </>
  );
}

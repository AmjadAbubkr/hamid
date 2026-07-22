import Link from "next/link";
import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getPublishedPositions,
  type PositionHeld,
} from "@/lib/content/positions";
import {
  getPublishedEducationEntries,
  type EducationEntry,
} from "@/lib/content/education";
import {
  getParticipationRoleLabel,
  getPublishedPastParticipations,
  type PastParticipation,
} from "@/lib/content/participations";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

type CareerPageProps = {
  params: Promise<{ locale: string }>;
};

function formatDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function positionText(position: PositionHeld, locale: LocaleCode) {
  return {
    title: locale === "ar" ? position.titleAr : position.titleFr,
    body: locale === "ar" ? position.bodyAr : position.bodyFr,
    present: locale === "ar" ? "حتى الآن" : "Aujourd’hui",
  };
}

function educationText(entry: EducationEntry, locale: LocaleCode) {
  return {
    degree: locale === "ar" ? entry.degreeAr : entry.degreeFr,
    institution: locale === "ar" ? entry.institutionAr : entry.institutionFr,
    honours: locale === "ar" ? entry.honoursAr : entry.honoursFr,
    present: locale === "ar" ? "حتى الآن" : "Aujourd’hui",
  };
}

function participationText(entry: PastParticipation, locale: LocaleCode) {
  return {
    title: locale === "ar" ? entry.titleAr : entry.titleFr,
    body: locale === "ar" ? entry.bodyAr : entry.bodyFr,
    venue: locale === "ar" ? entry.venueAr : entry.venueFr,
    institution: locale === "ar" ? entry.institutionAr : entry.institutionFr,
    role: getParticipationRoleLabel(
      entry.role,
      locale,
      entry.roleOtherAr,
      entry.roleOtherFr,
    ),
  };
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const positions = await getPublishedPositions();
  const educationEntries = await getPublishedEducationEntries();
  const participations = await getPublishedPastParticipations();

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {locale === "ar" ? "المسيرة المهنية" : "Parcours professionnel"}
        </h1>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
          {locale === "ar" ? "المناصب التي شغلها" : "Postes occupés"}
        </h2>

        {positions.length === 0 ? (
          <p className="mt-4 text-zinc-600">
            {locale === "ar"
              ? "لا توجد مناصب منشورة بعد."
              : "Aucun poste publié pour le moment."}
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-7 border-s border-zinc-300 ps-6">
            {positions.map((position) => {
              const localized = positionText(position, locale);
              const endDate = position.endDate
                ? formatDate(position.endDate, locale)
                : localized.present;

              return (
                <li key={position.slug} className="relative text-start">
                  <span
                    aria-hidden="true"
                    className="absolute start-[-1.72rem] top-2 h-3 w-3 rounded-full bg-zinc-900 ring-4 ring-white"
                  />
                  <article className="flex flex-col gap-2">
                    <p className="text-sm text-zinc-500">
                      {formatDate(position.startDate, locale)} — {endDate}
                    </p>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      <Link
                        href={`/${locale}/career/${position.slug}`}
                        className="rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
                      >
                        {localized.title}
                      </Link>
                    </h2>
                    <p className="text-zinc-700">{position.institution}</p>
                    <p className="text-sm text-zinc-500">
                      {position.location}
                    </p>
                    {localized.body ? (
                      <p className="leading-relaxed text-zinc-700">
                        {localized.body}
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        <section className="mt-12" aria-labelledby="education-heading">
          <h2
            id="education-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900"
          >
            {locale === "ar" ? "التعليم" : "Formation"}
          </h2>

          {educationEntries.length === 0 ? (
            <p className="mt-4 text-zinc-600">
              {locale === "ar"
                ? "لا توجد دراسات منشورة بعد."
                : "Aucune formation publiée pour le moment."}
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-7 border-s border-zinc-300 ps-6">
              {educationEntries.map((entry) => {
                const localized = educationText(entry, locale);
                const endDate = entry.endDate
                  ? formatDate(entry.endDate, locale)
                  : localized.present;

                return (
                  <li key={entry.slug} className="relative text-start">
                    <span
                      aria-hidden="true"
                      className="absolute start-[-1.72rem] top-2 h-3 w-3 rounded-full bg-zinc-900 ring-4 ring-white"
                    />
                    <article className="flex flex-col gap-2">
                      <p className="text-sm text-zinc-500">
                        {formatDate(entry.startDate, locale)} — {endDate}
                      </p>
                      <h3 className="text-xl font-semibold text-zinc-900">
                        <Link
                          href={`/${locale}/career/education/${entry.slug}`}
                          className="rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
                        >
                          {localized.degree}
                        </Link>
                      </h3>
                      <p className="text-zinc-700">{localized.institution}</p>
                      <p className="text-sm text-zinc-500">{entry.location}</p>
                      {localized.honours ? (
                        <p className="leading-relaxed text-zinc-700">
                          {localized.honours}
                        </p>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="mt-12" aria-labelledby="participations-heading">
          <h2
            id="participations-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900"
          >
            {locale === "ar" ? "المشاركات السابقة" : "Participations passées"}
          </h2>

          {participations.length === 0 ? (
            <p className="mt-4 text-zinc-600">
              {locale === "ar"
                ? "لا توجد مشاركات منشورة بعد."
                : "Aucune participation publiée pour le moment."}
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-7 border-s border-zinc-300 ps-6">
              {participations.map((entry) => {
                const localized = participationText(entry, locale);

                return (
                  <li key={entry.slug} className="relative text-start">
                    <span
                      aria-hidden="true"
                      className="absolute start-[-1.72rem] top-2 h-3 w-3 rounded-full bg-zinc-900 ring-4 ring-white"
                    />
                    <article className="flex flex-col gap-2">
                      <p className="text-sm text-zinc-500">
                        {entry.eventDateLabel}
                      </p>
                      <h3 className="text-xl font-semibold text-zinc-900">
                        <Link
                          href={`/${locale}/participations/${entry.slug}`}
                          className="rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
                        >
                          {localized.title}
                        </Link>
                      </h3>
                      <p className="text-zinc-700">{localized.institution}</p>
                      <p className="text-sm text-zinc-500">
                        {localized.venue} · {localized.role}
                      </p>
                      {localized.body ? (
                        <p className="leading-relaxed text-zinc-700">
                          {localized.body}
                        </p>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
      <CanonicalFooter pathname={`/${locale}/career`} />
    </>
  );
}

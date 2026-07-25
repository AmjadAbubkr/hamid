import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading, SectionHeading } from "@/components/public/section-heading";
import { Timeline, TimelineEntry } from "@/components/public/timeline";
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
    present: locale === "ar" ? "حتى الآن" : "Aujourd'hui",
  };
}

function educationText(entry: EducationEntry, locale: LocaleCode) {
  return {
    degree: locale === "ar" ? entry.degreeAr : entry.degreeFr,
    institution: locale === "ar" ? entry.institutionAr : entry.institutionFr,
    honours: locale === "ar" ? entry.honoursAr : entry.honoursFr,
    present: locale === "ar" ? "حتى الآن" : "Aujourd'hui",
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
      entry.roleOtherEn,
    ),
  };
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const [positions, educationEntries, participations] = await Promise.all([
    getPublishedPositions(),
    getPublishedEducationEntries(),
    getPublishedPastParticipations(),
  ]);

  const presentBadge = locale === "ar" ? "حتى الآن" : "En cours";

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-6 py-14 text-start sm:px-8 sm:py-20">
        <PageEntrance>
          <PageHeading
            eyebrow={locale === "ar" ? "المسيرة المهنية" : "Trajectoire"}
            title={locale === "ar" ? "المناصب والتعليم والمشاركات" : "Parcours professionnel"}
            intro={
              locale === "ar"
                ? "مراجعة شاملة للمناصب والتعليم والمشاركات الدولية والإقليمية."
                : "Une chronologie des fonctions occupées, de la formation et des engagements officiels."
            }
          />
        </PageEntrance>

        <MotionReveal delay={60}>
          <section aria-labelledby="career-positions" className="flex flex-col gap-8">
            <SectionHeading
              id="career-positions"
              icon="briefcase"
              eyebrow={locale === "ar" ? "المناصب الحالية والسابقة" : "Postes"}
              title={locale === "ar" ? "المناصب التي شغلها" : "Postes occupés"}
            />
            {positions.length ? (
              <Timeline ariaLabel={locale === "ar" ? "المناصب التي شغلها" : "Postes occupés"}>
                {positions.map((position) => {
                  const localized = positionText(position, locale);
                  const endDate = position.endDate
                    ? formatDate(position.endDate, locale)
                    : localized.present;
                  return (
                    <TimelineEntry
                      key={position.slug}
                      dateLabel={`${formatDate(position.startDate, locale)} — ${endDate}`}
                      title={localized.title}
                      titleHref={`/${locale}/career/${position.slug}` as const}
                      meta={
                        <>
                          <p className="font-serif text-lg font-semibold text-ink">
                            {position.institution}
                          </p>
                          <p className="text-sm text-ink-600">{position.location}</p>
                        </>
                      }
                      excerpt={localized.body}
                      presentBadge={position.endDate === null}
                      badgeText={presentBadge}
                    />
                  );
                })}
              </Timeline>
            ) : (
              <EmptyState
                icon="briefcase"
                heading={locale === "ar" ? "لا توجد مناصب منشورة" : "Aucun poste publié"}
                body={
                  locale === "ar"
                    ? "تظهر المناصب التي شغلها هنا."
                    : "Les postes publiés apparaîtront ici."
                }
              />
            )}
          </section>
        </MotionReveal>

        <MotionReveal delay={120}>
          <section aria-labelledby="career-education" className="flex flex-col gap-8">
            <SectionHeading
              id="career-education"
              icon="article"
              eyebrow={locale === "ar" ? "التعليم والشهادات" : "Formation"}
              title={locale === "ar" ? "التعليم والشهادات والدراسات" : "Formation"}
            />
            {educationEntries.length ? (
              <Timeline ariaLabel={locale === "ar" ? "التعليم والشهادات" : "Formation"}>
                {educationEntries.map((entry) => {
                  const localized = educationText(entry, locale);
                  const endDate = entry.endDate
                    ? formatDate(entry.endDate, locale)
                    : localized.present;
                  return (
                    <TimelineEntry
                      key={entry.slug}
                      dateLabel={`${formatDate(entry.startDate, locale)} — ${endDate}`}
                      title={localized.degree}
                      titleHref={`/${locale}/career/education/${entry.slug}` as const}
                      meta={
                        <>
                          <p className="font-serif text-lg font-semibold text-ink">
                            {localized.institution}
                          </p>
                          <p className="text-sm text-ink-600">{entry.location}</p>
                        </>
                      }
                      excerpt={localized.honours}
                      presentBadge={entry.endDate === null}
                      badgeText={presentBadge}
                    />
                  );
                })}
              </Timeline>
            ) : (
              <EmptyState
                icon="article"
                heading={locale === "ar" ? "لا توجد دراسات منشورة" : "Aucune formation publiée"}
                body={
                  locale === "ar"
                    ? "تظهر الدراسات التي أتمّتها هنا."
                    : "Les formations publiées apparaîtront ici."
                }
              />
            )}
          </section>
        </MotionReveal>

        <MotionReveal delay={180}>
          <section aria-labelledby="career-participations" className="flex flex-col gap-8">
            <SectionHeading
              id="career-participations"
              icon="globe"
              eyebrow={locale === "ar" ? "المشاركات الدولية والإقليمية" : "Participations"}
              title={locale === "ar" ? "المشاركات الدولية والإقليمية" : "Participations passées"}
            />
            {participations.length ? (
              <Timeline ariaLabel={locale === "ar" ? "المشاركات الدولية والإقليمية" : "Participations passées"}>
                {participations.map((entry) => {
                  const localized = participationText(entry, locale);
                  return (
                    <TimelineEntry
                      key={entry.slug}
                      dateLabel={entry.eventDateLabel}
                      title={localized.title}
                      titleHref={`/${locale}/participations/${entry.slug}` as const}
                      meta={
                        <>
                          <p className="font-serif text-lg font-semibold text-ink">
                            {localized.institution}
                          </p>
                          <p className="text-sm text-ink-600">
                            {localized.venue} — {localized.role}
                          </p>
                        </>
                      }
                      excerpt={localized.body}
                    />
                  );
                })}
              </Timeline>
            ) : (
              <EmptyState
                icon="globe"
                heading={locale === "ar" ? "لا توجد مشاركات منشورة" : "Aucune participation publiée"}
                body={
                  locale === "ar"
                    ? "تظهر المشاركات التي أقمتها هنا."
                    : "Les participations publiées apparaîtront ici."
                }
              />
            )}
          </section>
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/career`} locale={locale} />
    </>
  );
}

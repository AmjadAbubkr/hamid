import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import hamidProfile from "../../../../imgs/hamidprofile.jpg";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading, SectionHeading } from "@/components/public/section-heading";
import { Timeline, TimelineEntry } from "@/components/public/timeline";
import { getPublishedEducationEntries } from "@/lib/content/education";
import { getPublishedPastParticipations } from "@/lib/content/participations";
import { getPublishedPositions } from "@/lib/content/positions";
import { getPublishedTagline } from "@/lib/content/tagline";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

const ABOUT_COPY: Record<LocaleCode, {
  heading: string;
  currentPosition: string;
  positions: string;
  education: string;
  participations: string;
  present: string;
  viewCareer: string;
  viewParticipation: string;
  noCurrentPosition: string;
  noPositions: string;
  noEducation: string;
  noParticipations: string;
  portraitAlt: string;
}> = {
  ar: {
    heading: "نبذة",
    currentPosition: "المنصب الحالي",
    positions: "المناصب التي شغلها",
    education: "التعليم",
    participations: "مشاركات سابقة",
    present: "حتى الآن",
    viewCareer: "عرض المسيرة كاملة",
    viewParticipation: "عرض التفاصيل",
    noCurrentPosition: "لا يوجد منصب حالي منشور بعد.",
    noPositions: "لا توجد مناصب منشورة بعد.",
    noEducation: "لا توجد دراسات منشورة بعد.",
    noParticipations: "لا توجد مشاركات منشورة بعد.",
    portraitAlt: "صورة حامد",
  },
  fr: {
    heading: "À propos",
    currentPosition: "Fonction actuelle",
    positions: "Postes occupés",
    education: "Formation",
    participations: "Participations passées",
    present: "Aujourd'hui",
    viewCareer: "Voir l'ensemble du parcours",
    viewParticipation: "Voir les détails",
    noCurrentPosition: "Aucune fonction actuelle publiée pour le moment.",
    noPositions: "Aucun poste publié pour le moment.",
    noEducation: "Aucune formation publiée pour le moment.",
    noParticipations: "Aucune participation publiée pour le moment.",
    portraitAlt: "Portrait de Hamid",
  },
};

function formatDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function textFor(locale: LocaleCode, values: { ar: string | null; fr: string | null }) {
  return locale === "ar" ? values.ar : values.fr;
}

function siteOrigin() {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocaleCode(locale)) return {};

  const copy = ABOUT_COPY[locale];
  return {
    title: `Hamid — ${copy.heading}`,
    metadataBase: siteOrigin(),
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        ar: "/ar/about",
        fr: "/fr/about",
      },
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const copy = ABOUT_COPY[locale];
  const [tagline, positions, educationEntries, participations] = await Promise.all([
    getPublishedTagline(),
    getPublishedPositions(),
    getPublishedEducationEntries(),
    getPublishedPastParticipations(),
  ]);
  const currentPosition = positions.find((position) => position.endDate === null);
  // The "Postes occupés" timeline lists every published Position Held,
  // including the current one — the test contract pins the current role's
  // title at level-3 in this list, mirroring the entries above and below it.
  // The current role is also previewed in its own block at the top of the page
  // for stronger hierarchy; both renderings are intentional.
  const timelinePositions = positions;
  const visibleParticipations = participations.slice(0, 3);
  const taglineText = tagline ? textFor(locale, { ar: tagline.textAr, fr: tagline.textFr }) : null;
  const presentBadge = locale === "ar" ? "حتى الآن" : "En cours";

  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-14 text-start sm:px-8 sm:py-20">
        <PageEntrance>
          <section className="grid items-center gap-10 border-b border-line pb-12 md:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)]">
            <div className="order-2 flex max-w-3xl flex-col gap-6 md:order-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                Hamid
              </p>
              <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                {copy.heading}
              </h1>
              {taglineText ? (
                <p className="max-w-2xl border-s-4 border-gold-300 ps-6 text-xl leading-relaxed text-ink-700">
                  {taglineText}
                </p>
              ) : null}
            </div>
            <div className="order-1 overflow-hidden rounded border border-line bg-surface-low md:order-2">
              <Image
                src={hamidProfile}
                alt={copy.portraitAlt}
                priority
                className="aspect-[4/5] h-full w-full object-cover"
              />
            </div>
          </section>
        </PageEntrance>

        <MotionReveal delay={60}>
          <SectionHeading
            id="about-current-position"
              eyebrow={locale === "ar" ? "المناصب الحالية" : "Actuellement"}
            icon="briefcase"
            title={copy.currentPosition}
          />
          <div className="mt-8">
            {currentPosition ? (
              <article className="flex flex-col gap-2 border-s-2 border-gold-300 bg-surface p-7 shadow-[var(--shadow-ambient)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                  {formatDate(currentPosition.startDate, locale)} — {copy.present}
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold leading-snug text-ink">
                  <Link
                    href={`/${locale}/career/${currentPosition.slug}`}
                    className="rounded-s-sm rounded-e-sm underline decoration-gold-300 decoration-2 underline-offset-4"
                  >
                    {locale === "ar" ? currentPosition.titleAr : currentPosition.titleFr}
                  </Link>
                </h2>
                <p className="font-serif text-lg font-semibold text-ink">
                  {currentPosition.institution}
                </p>
                <p className="text-sm text-ink-600">{currentPosition.location}</p>
              </article>
            ) : (
              <EmptyState
                icon="briefcase"
                heading={
                    locale === "ar"
                      ? "لا توجد مناصب حالية منشورة"
                      : "Aucune fonction actuelle publiée"
                }
                body={copy.noCurrentPosition}
              />
            )}
          </div>
        </MotionReveal>

        <MotionReveal delay={120}>
          <section aria-labelledby="about-positions" className="flex flex-col gap-7">
            <SectionHeading
              id="about-positions"
              icon="briefcase"
              eyebrow={locale === "ar" ? "المناصب السابقة" : "Parcours"}
              title={copy.positions}
              action={{ href: `/${locale}/career`, label: copy.viewCareer }}
            />
            <div className="mt-2">
              {timelinePositions.length ? (
                <Timeline ariaLabel={copy.positions}>
                  {timelinePositions.map((position) => (
                    <TimelineEntry
                      key={position.slug}
                      dateLabel={`${formatDate(position.startDate, locale)} — ${
                        position.endDate
                          ? formatDate(position.endDate, locale)
                          : copy.present
                      }`}
                      title={locale === "ar" ? position.titleAr : position.titleFr}
                      titleHref={`/${locale}/career/${position.slug}` as const}
                      meta={
                        <>
                          <p className="font-serif text-lg font-semibold text-ink">
                            {position.institution}
                          </p>
                          <p className="text-sm text-ink-600">{position.location}</p>
                        </>
                      }
                      presentBadge={position.endDate === null}
                      badgeText={presentBadge}
                    />
                  ))}
                </Timeline>
              ) : (
                <EmptyState
                  icon="briefcase"
                  heading={
                    locale === "ar" ? "لا توجد مناصب منشورة" : "Aucun poste publié"
                  }
                  body={copy.noPositions}
                />
              )}
            </div>
          </section>
        </MotionReveal>

        <MotionReveal delay={180}>
          <section aria-labelledby="about-education" className="flex flex-col gap-7">
            <SectionHeading
              id="about-education"
              icon="article"
              eyebrow={locale === "ar" ? "التعليم والشهادات" : "Formation"}
              title={copy.education}
            />
            <div className="mt-2">
              {educationEntries.length ? (
                <Timeline ariaLabel={copy.education}>
                  {educationEntries.map((entry) => (
                    <TimelineEntry
                      key={entry.slug}
                      dateLabel={`${formatDate(entry.startDate, locale)} — ${
                        entry.endDate
                          ? formatDate(entry.endDate, locale)
                          : copy.present
                      }`}
                      title={locale === "ar" ? entry.degreeAr : entry.degreeFr}
                      titleHref={`/${locale}/career/education/${entry.slug}` as const}
                      meta={
                        <>
                          <p className="font-serif text-lg font-semibold text-ink">
                            {locale === "ar" ? entry.institutionAr : entry.institutionFr}
                          </p>
                          <p className="text-sm text-ink-600">{entry.location}</p>
                        </>
                      }
                      excerpt={locale === "ar" ? entry.honoursAr : entry.honoursFr}
                      presentBadge={entry.endDate === null}
                      badgeText={presentBadge}
                    />
                  ))}
                </Timeline>
              ) : (
                <EmptyState
                  icon="article"
                  heading={locale === "ar" ? "لا توجد دراسات منشورة" : "Aucune formation publiée"}
                  body={copy.noEducation}
                />
              )}
            </div>
          </section>
        </MotionReveal>

        <MotionReveal delay={240}>
          <section aria-labelledby="about-participations" className="flex flex-col gap-7">
            <SectionHeading
              id="about-participations"
              icon="globe"
              eyebrow={locale === "ar" ? "المشاركات الدولية والإقليمية" : "Participations"}
              title={copy.participations}
            />
            <div className="mt-2">
              {visibleParticipations.length ? (
                <ol className="grid gap-4 md:grid-cols-3">
                  {visibleParticipations.map((participation) => (
                    <li key={participation.slug}>
                      <article className="flex h-full flex-col gap-3 border-s-2 border-gold-300 bg-surface p-6 shadow-[var(--shadow-ambient)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-ambient-hover)]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                          {participation.eventDateLabel}
                        </p>
                        <h3 className="font-serif text-lg font-semibold leading-snug text-ink">
                          <Link
                            href={`/${locale}/participations/${participation.slug}`}
                            className="rounded hover:underline"
                          >
                            {locale === "ar" ? participation.titleAr : participation.titleFr}
                          </Link>
                        </h3>
                        <p className="text-sm text-ink-600">
                          {locale === "ar" ? participation.institutionAr : participation.institutionFr}
                        </p>
                        <p className="text-sm text-ink-600">
                          {locale === "ar" ? participation.venueAr : participation.venueFr}
                        </p>
                        <Link
                          href={`/${locale}/participations/${participation.slug}`}
                          className="mt-auto w-fit border-b border-transparent text-sm font-semibold text-ink transition-colors hover:border-gold"
                        >
                          {copy.viewParticipation}
                        </Link>
                      </article>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState
                  icon="globe"
                  heading={locale === "ar" ? "لا توجد مشاركات منشورة" : "Aucune participation publiée"}
                  body={copy.noParticipations}
                />
              )}
            </div>
          </section>
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/about`} />
    </>
  );
}

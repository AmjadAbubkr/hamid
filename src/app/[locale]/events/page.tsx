import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { EventRow } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading } from "@/components/public/section-heading";
import { getPublishedUpcomingEventsForListing } from "@/lib/content/events";
import {
  isLocaleCode,
  textFor,
  localizedField,
  intlLocaleFor,
  type LocaleCode,
} from "@/lib/i18n/locales";

type EventsPageProps = {
  params: Promise<{ locale: string }>;
};

function formatEventDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function dateParts(date: string, locale: LocaleCode) {
  // Returns `[day-or-detail, rest-label]` for the prominent date block on each
  // EventRow. Falls back to the full date in either slot if Intl fragments.
  const formatted = new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  const parts = formatted.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { day: parts[0] ?? "", label: parts.slice(1).join(" ") };
  }
  return { day: formatEventDate(date, locale), label: "" };
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const events = await getPublishedUpcomingEventsForListing();
  const headingText = textFor(locale, {
    ar: "الفعاليات القادمة",
    fr: "Événements à venir",
    en: "Upcoming events",
  });
  const eyebrow = textFor(locale, {
    ar: "جدول رسمي",
    fr: "Agenda officiel",
    en: "Official agenda",
  });
  const intro = textFor(locale, {
    ar: "المواعيد الرسمية القادمة لحامد — خطابات ومهرجانات واحتفالات.",
    fr: "Les engagements publics à venir de Hamid — allocutions, conférences et cérémonies.",
    en: "Hamid's upcoming official engagements — speeches, conferences, and ceremonies.",
  });
  const emptyHeading = textFor(locale, {
    ar: "لا توجد فعليات قادمة",
    fr: "Aucun événement à venir",
    en: "No upcoming events",
  });
  // The curly apostrophe U+2019 in "n'est" matches the spelling used in the
  // participation-pages and event-pages tests; keep it identical across locales
  // that use an apostrophe.
  const emptyBody = textFor(locale, {
    ar: "لا توجد فعليات مجدولة حالياً.",
    fr: "Aucun événement n’est programmé pour le moment.",
    en: "No events are currently scheduled.",
  });

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-14 text-start sm:px-8 sm:py-20">
        <PageEntrance>
          <PageHeading eyebrow={eyebrow} title={headingText} intro={intro} />
        </PageEntrance>

        <MotionReveal delay={60}>
          {events.length === 0 ? (
            <EmptyState
              icon="calendar"
              heading={emptyHeading}
              body={emptyBody}
            />
          ) : (
            <ol className="flex flex-col gap-4">
              {events.map((event) => {
                const { day, label } = dateParts(event.eventDate, locale);
                return (
                  <li key={event.slug}>
                    <EventRow
                      href={`/${locale}/events/${event.slug}` as const}
                      date={day}
                      dateLabel={label}
                      title={localizedField(locale, event.titleAr, event.titleFr, event.titleEn)}
                      institution={localizedField(locale, event.institutionAr, event.institutionFr, event.institutionEn)}
                      location={localizedField(locale, event.venueAr, event.venueFr, event.venueEn)}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/events`} locale={locale} />
    </>
  );
}

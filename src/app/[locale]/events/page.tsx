import Link from "next/link";
import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { getPublishedUpcomingEventsForListing } from "@/lib/content/events";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

type EventsPageProps = {
  params: Promise<{ locale: string }>;
};

function formatEventDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const events = await getPublishedUpcomingEventsForListing();

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {locale === "ar" ? "الفعاليات القادمة" : "Événements à venir"}
        </h1>

        {events.length === 0 ? (
          <p className="mt-4 text-zinc-600">
            {locale === "ar"
              ? "لا توجد فعاليات مجدولة حالياً."
              : "Aucun événement n’est programmé pour le moment."}
          </p>
        ) : (
          <ol className="mt-8 flex flex-col gap-5">
            {events.map((event) => {
              const title = locale === "ar" ? event.titleAr : event.titleFr;
              const venue = locale === "ar" ? event.venueAr : event.venueFr;
              const institution = locale === "ar"
                ? event.institutionAr
                : event.institutionFr;

              return (
                <li key={event.slug}>
                  <article className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-5">
                    <p className="text-sm text-zinc-500">
                      {formatEventDate(event.eventDate, locale)}
                    </p>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      <Link
                        href={`/${locale}/events/${event.slug}`}
                        className="rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
                      >
                        {title}
                      </Link>
                    </h2>
                    <p className="text-zinc-700">{institution}</p>
                    <p className="text-sm text-zinc-500">{venue}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <CanonicalFooter pathname={`/${locale}/events`} />
    </>
  );
}

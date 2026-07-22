import { notFound } from "next/navigation";
import { isLocaleCode, LOCALE_META, type LocaleCode } from "@/lib/i18n/locales";
import { STRINGS } from "@/lib/i18n/strings";
import { CanonicalFooter } from "@/components/canonical-footer";
import { DemoCard } from "@/components/demo-card";
import { getPublishedUpcomingEvents } from "@/lib/content/events";
import Link from "next/link";

type Params = { params: Promise<{ locale: string }> };

function formatEventDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function LocalePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) {
    notFound();
  }
  const locale: LocaleCode = rawLocale;
  const s = STRINGS[locale];
  const otherLocale: LocaleCode = locale === "ar" ? "fr" : "ar";
  // The homepage deliberately surfaces the next three events: useful context
  // without turning the Profile into an event listing.
  const upcomingEvents = (await getPublishedUpcomingEvents()).slice(0, 3);

  return (
    <>
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

      {upcomingEvents.length > 0 ? (
        <section
          aria-labelledby="upcoming-events-heading"
          className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-5 text-start"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="upcoming-events-heading" className="text-xl font-semibold text-zinc-900">
              {locale === "ar" ? "الفعاليات القادمة" : "Événements à venir"}
            </h2>
            <Link
              href={`/${locale}/events`}
              className="rounded-s-sm rounded-e-sm text-sm font-medium underline decoration-zinc-400 underline-offset-4"
            >
              {locale === "ar" ? "عرض الكل" : "Tout voir"}
            </Link>
          </div>
          <ol className="flex flex-col gap-4">
            {upcomingEvents.map((event) => {
              const title = locale === "ar" ? event.titleAr : event.titleFr;
              const venue = locale === "ar" ? event.venueAr : event.venueFr;

              return (
                <li key={event.slug} className="flex flex-col gap-1">
                  <p className="text-sm text-zinc-500">
                    {formatEventDate(event.eventDate, locale)} · {venue}
                  </p>
                  <Link
                    href={`/${locale}/events/${event.slug}`}
                    className="w-fit rounded-s-sm rounded-e-sm font-semibold text-zinc-900 underline decoration-zinc-400 underline-offset-4"
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <nav className="text-start">
        <Link
          href={`/${locale}/events`}
          className="inline-block ps-3 pe-3 ms-1 me-1 py-2 text-start rounded-s-md rounded-e-md border border-zinc-900 text-zinc-900 text-sm font-medium"
        >
          {locale === "ar" ? "الفعاليات" : "Événements"}
        </Link>
        <Link
          href={`/${otherLocale}`}
          className="inline-block ps-3 pe-3 ms-1 me-1 py-2 text-start rounded-s-md rounded-e-md bg-zinc-900 text-zinc-50 text-sm font-medium"
        >
          {s.switchPrompt}
        </Link>
      </nav>
    </main>
    <CanonicalFooter pathname={`/${locale}`} />
    </>
  );
}

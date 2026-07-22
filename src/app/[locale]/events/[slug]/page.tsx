import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getPublishedUpcomingEventBySlug,
  getPublishedUpcomingEvents,
} from "@/lib/content/events";
import { getParticipationRoleLabel } from "@/lib/content/participations";
import { isLocaleCode, LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { safeHttpUrl } from "@/lib/safe-http-url";

type EventDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const events = await getPublishedUpcomingEvents();

  return LOCALES.flatMap((locale) =>
    events.map((event) => ({ locale, slug: event.slug })),
  );
}

function formatEventDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const event = await getPublishedUpcomingEventBySlug(slug);
  if (!event) notFound();

  const title = locale === "ar" ? event.titleAr : event.titleFr;
  const body = locale === "ar" ? event.bodyAr : event.bodyFr;
  const venue = locale === "ar" ? event.venueAr : event.venueFr;
  const institution = locale === "ar" ? event.institutionAr : event.institutionFr;
  const role = getParticipationRoleLabel(
    event.role,
    locale,
    event.roleOtherAr,
    event.roleOtherFr,
  );
  const registrationUrl = safeHttpUrl(event.registrationUrl);

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <article className="flex flex-col gap-5">
          <p className="text-sm text-zinc-500">
            {formatEventDate(event.eventDate, locale)}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
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
                {locale === "ar" ? "المكان" : "Lieu"}
              </dt>
              <dd>{venue}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">
                {locale === "ar" ? "الدور" : "Rôle"}
              </dt>
              <dd>{role}</dd>
            </div>
          </dl>
          {body ? <p className="leading-relaxed text-zinc-700">{body}</p> : null}
          {registrationUrl ? (
            <a
              href={registrationUrl}
              className="w-fit rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
              rel="noreferrer"
              target="_blank"
            >
              {locale === "ar" ? "التسجيل" : "S’inscrire"}
            </a>
          ) : null}
        </article>
      </main>
      <CanonicalFooter pathname={`/${locale}/events/${event.slug}`} />
    </>
  );
}

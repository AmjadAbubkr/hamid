import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getParticipationRoleLabel,
  getPublishedPastParticipationBySlug,
  getPublishedPastParticipations,
} from "@/lib/content/participations";
import { isLocaleCode, LOCALES } from "@/lib/i18n/locales";
import { safeHttpUrl } from "@/lib/safe-http-url";

type ParticipationDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const participations = await getPublishedPastParticipations();

  return LOCALES.flatMap((locale) =>
    participations.map((participation) => ({
      locale,
      slug: participation.slug,
    })),
  );
}

export default async function ParticipationDetailPage({
  params,
}: ParticipationDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const participation = await getPublishedPastParticipationBySlug(slug);
  if (!participation) notFound();

  const title = locale === "ar" ? participation.titleAr : participation.titleFr;
  const body = locale === "ar" ? participation.bodyAr : participation.bodyFr;
  const venue = locale === "ar" ? participation.venueAr : participation.venueFr;
  const institution =
    locale === "ar" ? participation.institutionAr : participation.institutionFr;
  const role = getParticipationRoleLabel(
    participation.role,
    locale,
    participation.roleOtherAr,
    participation.roleOtherFr,
    participation.roleOtherEn,
  );
  const sourceUrl = safeHttpUrl(participation.sourceUrl);

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <article className="flex flex-col gap-5">
          <p className="text-sm text-zinc-500">
            {participation.eventDateLabel}
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
          {sourceUrl ? (
            <a
              href={sourceUrl}
              className="w-fit rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
              rel="noreferrer"
              target="_blank"
            >
              {locale === "ar" ? "المصدر" : "Source"}
            </a>
          ) : null}
        </article>
      </main>
      <CanonicalFooter pathname={`/${locale}/participations/${participation.slug}`} locale={locale} />
    </>
  );
}

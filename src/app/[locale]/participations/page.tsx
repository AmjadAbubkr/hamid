import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { EventRow } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading } from "@/components/public/section-heading";
import { getPublishedPastParticipations } from "@/lib/content/participations";
import { isLocaleCode, localizedField, textFor } from "@/lib/i18n/locales";

type ParticipationPageProps = { params: Promise<{ locale: string }> };

export default async function ParticipationsPage({ params }: ParticipationPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const participations = await getPublishedPastParticipations();
  const title = textFor(locale, {
    ar: "المشاركات السابقة",
    fr: "Participations passées",
    en: "Past participations",
  });

  return <>
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-14 text-start sm:px-8 sm:py-20">
      <PageEntrance><PageHeading eyebrow={textFor(locale, { ar: "المسيرة العامة", fr: "Parcours public", en: "Public record" })} title={title} intro={textFor(locale, { ar: "المؤتمرات واللقاءات والتمثيل الرسمي.", fr: "Conférences, rencontres et représentations officielles.", en: "Conferences, meetings, and official representations." })} /></PageEntrance>
      <MotionReveal delay={60}>
        {participations.length === 0 ? <EmptyState icon="globe" heading={textFor(locale, { ar: "لا توجد مشاركات منشورة", fr: "Aucune participation publiée", en: "No participations published" })} body={textFor(locale, { ar: "ستظهر المشاركات المنشورة هنا.", fr: "Les participations publiées apparaîtront ici.", en: "Published participations will appear here." })} /> : (
          <ol className="flex flex-col gap-4">
            {participations.map((participation) => <li key={participation.slug}><EventRow
              href={`/${locale}/participations/${participation.slug}` as const}
              date={participation.eventDateLabel}
              dateLabel=""
              title={localizedField(locale, participation.titleAr, participation.titleFr, participation.titleEn)}
              institution={localizedField(locale, participation.institutionAr, participation.institutionFr, participation.institutionEn)}
              location={localizedField(locale, participation.venueAr, participation.venueFr, participation.venueEn)}
            /></li>)}
          </ol>
        )}
      </MotionReveal>
    </main>
    <CanonicalFooter pathname={`/${locale}/participations`} locale={locale} />
  </>;
}

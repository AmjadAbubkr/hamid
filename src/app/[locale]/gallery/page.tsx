import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { GalleryGrid, type GalleryGridPhoto } from "@/components/gallery-grid";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { galleryPublicUrl, getPublishedGalleryPhotos } from "@/lib/content/gallery";
import { isLocaleCode, textFor, localizedField, type LocaleCode } from "@/lib/i18n/locales";

type GalleryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale: LocaleCode = rawLocale;
  const galleryPhotos = await getPublishedGalleryPhotos();
  const photos: GalleryGridPhoto[] = galleryPhotos.flatMap((photo) => {
    const src = galleryPublicUrl(photo.storagePath);
    if (!src) return [];

    return [{
      id: photo.id,
      src,
      caption: localizedField(locale, photo.captionAr, photo.captionFr, photo.captionEn),
      category: localizedField(locale, photo.categoryAr, photo.categoryFr, photo.categoryEn),
      takenDate: photo.takenDate,
      photographerCredit: localizedField(locale, photo.photographerCreditAr, photo.photographerCreditFr, photo.photographerCreditEn),
    }];
  });

  const headingText = textFor(locale, {
    ar: "المعرض",
    fr: "Galerie",
    en: "Gallery",
  });
  const eyebrow = textFor(locale, {
    ar: "لقطات رسمية",
    fr: "Moments documentés",
    en: "Documented moments",
  });
  const intro = textFor(locale, {
    ar: "صور رسمية وتوثيقية من المهام الرسمية لحامد.",
    fr: "Photographies officielles et documentaires des missions publiques de Hamid.",
    en: "Official and documentary photographs from Hamid's public missions.",
  });
  const emptyLabel = textFor(locale, {
    ar: "لا توجد صور منشورة بعد.",
    fr: "Aucune photo publiée pour le moment.",
    en: "No published photos yet.",
  });
  const galleryAriaLabel = textFor(locale, {
    ar: "المعرض",
    fr: "Galerie",
    en: "Gallery",
  });
  const closeLabel = textFor(locale, {
    ar: "إغلاق",
    fr: "Fermer",
    en: "Close",
  });

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-14 text-start sm:px-8 sm:py-20">
        <PageEntrance>
          <header className="flex flex-col gap-3 border-b border-line pb-6">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
              <span>{eyebrow}</span>
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {headingText}
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-700">
              {intro}
            </p>
          </header>
        </PageEntrance>
        <MotionReveal delay={100}>
          <GalleryGrid
            photos={photos}
            emptyLabel={emptyLabel}
            galleryAriaLabel={galleryAriaLabel}
            closeLabel={closeLabel}
          />
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/gallery`} locale={locale} />
    </>
  );
}

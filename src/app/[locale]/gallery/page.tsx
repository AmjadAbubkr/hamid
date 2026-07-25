import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { GalleryGrid, type GalleryGridPhoto } from "@/components/gallery-grid";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { galleryPublicUrl, getPublishedGalleryPhotos } from "@/lib/content/gallery";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

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
      caption: locale === "ar" ? photo.captionAr : photo.captionFr,
      category: locale === "ar" ? photo.categoryAr : photo.categoryFr,
      takenDate: photo.takenDate,
      photographerCredit: locale === "ar" ? photo.photographerCreditAr : photo.photographerCreditFr,
    }];
  });

  const headingText = locale === "ar" ? "المعرض" : "Galerie";
  const eyebrow = locale === "ar" ? "لقطات رسمية" : "Moments documentés";
  const intro =
    locale === "ar"
      ? "صور رسمية وتوثيقية من المهام الرسمية لحامد."
      : "Photographies officielles et documentaires des missions publiques de Hamid.";

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
            emptyLabel={locale === "ar" ? "لا توجد صور منشورة بعد." : "Aucune photo publiée pour le moment."}
          />
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/gallery`} />
    </>
  );
}

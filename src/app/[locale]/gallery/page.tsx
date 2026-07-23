import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { GalleryGrid, type GalleryGridPhoto } from "@/components/gallery-grid";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { galleryPublicUrl, getPublishedGalleryPhotos } from "@/lib/content/gallery";
import { isLocaleCode } from "@/lib/i18n/locales";

type GalleryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
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

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12 text-start">
        <PageEntrance>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7b5800]">
            {locale === "ar" ? "لحظات موثقة" : "Moments documentés"}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#04162e]">
            {locale === "ar" ? "معرض الصور" : "Galerie"}
          </h1>
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

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import profileImage from "../../../imgs/hamid4.jpg";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { ProfileIcon } from "@/components/profile-icons";
import { galleryPublicUrl, getPublishedGalleryPhotos } from "@/lib/content/gallery";
import { getPublishedArticles } from "@/lib/content/articles";
import { getPublishedUpcomingEvents } from "@/lib/content/events";
import { getPublishedPastParticipations } from "@/lib/content/participations";
import { getPublishedPositions } from "@/lib/content/positions";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

type Params = { params: Promise<{ locale: string }> };

function displayDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function heroRole(locale: LocaleCode, currentPosition: Awaited<ReturnType<typeof getPublishedPositions>>[number] | undefined) {
  if (currentPosition) {
    return {
      title: locale === "ar" ? currentPosition.titleAr : currentPosition.titleFr,
      institution: currentPosition.institution,
      context: currentPosition.startDate ? displayDate(currentPosition.startDate, locale) : null,
    };
  }

  return locale === "ar"
    ? { title: "مفتش تقني", institution: "وزارة الاتصال", context: "مرسوم رقم 1005/PR/PM/MC/2026 - 22 مايو 2026" }
    : { title: "Inspecteur technique", institution: "Ministère de la Communication", context: "Décret n° 1005/PR/PM/MC/2026 du 22 mai 2026" };
}

export default async function LocalePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();
  const locale = rawLocale;

  const [positions, articles, galleryPhotos, participations, upcomingEvents] = await Promise.all([
    getPublishedPositions(),
    getPublishedArticles(),
    getPublishedGalleryPhotos(),
    getPublishedPastParticipations(),
    getPublishedUpcomingEvents(),
  ]);
  const currentPosition = positions.find((position) => position.endDate === null);
  const role = heroRole(locale, currentPosition);
  const galleryPreview = galleryPhotos
    .slice(0, 3)
    .flatMap((photo) => {
      const src = galleryPublicUrl(photo.storagePath);
      return src ? [{ id: photo.id, src, caption: locale === "ar" ? photo.captionAr : photo.captionFr }] : [];
    });

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-6 py-10 text-start sm:px-8 sm:py-16">
        <PageEntrance className="grid overflow-hidden rounded border border-[#c5c6ce] bg-white shadow-[0_20px_40px_rgba(4,22,46,0.08)] lg:grid-cols-2">
          <section className="flex flex-col justify-center gap-5 p-7 sm:p-10 lg:p-14">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#7b5800]">
              <ProfileIcon name="profile" className="h-4 w-4" />
              {locale === "ar" ? "الملف العام الرسمي" : "Profil public officiel"}
            </p>
            <p className="max-w-xl text-pretty text-lg leading-8 text-[#44474d]">
              {locale === "ar"
                ? "مسار مهني في القانون الدولي والشؤون الدبلوماسية والتعاون الإقليمي."
                : "Un parcours consacré au droit international, aux affaires diplomatiques et à la coopération régionale."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${locale}/about`} className="rounded bg-[#04162e] px-5 py-3 text-sm font-semibold text-white transition-[scale,background-color] duration-150 ease-out hover:bg-[#1a2b44] active:scale-[0.96]">
                {locale === "ar" ? "اكتشف الملف" : "Découvrir le profil"}
              </Link>
              <Link href={`/${locale}/career`} className="rounded border border-[#7b5800] px-5 py-3 text-sm font-semibold text-[#04162e] transition-[scale,background-color] duration-150 ease-out hover:bg-[#ffdea6] active:scale-[0.96]">
                {locale === "ar" ? "المسيرة" : "Parcours"}
              </Link>
            </div>
          </section>
          <div className="relative min-h-[30rem] overflow-hidden bg-[#04162e] sm:min-h-[36rem]">
            <div className="absolute inset-0">
              <Image
                src={profileImage}
                alt="Hamid Mahamat Azaz"
                priority
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#04162e]/95 via-[#04162e]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#ffdea6]">
                <ProfileIcon name="briefcase" className="h-4 w-4" />
                {locale === "ar" ? "المنصب الحالي" : "Fonction actuelle"}
              </p>
              <h1 className="mt-3 max-w-xl text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Hamid Mahamat Azaz
              </h1>
              <p className="mt-4 text-xl font-semibold text-white">{role.title}</p>
              <p className="mt-1 text-base text-white/85">{role.institution}</p>
              {role.context ? <p className="mt-3 text-sm text-white/75">{role.context}</p> : null}
            </div>
          </div>
        </PageEntrance>

        <MotionReveal delay={80}>
          <SectionHeading icon="profile" eyebrow={locale === "ar" ? "نبذة" : "À propos"} title={locale === "ar" ? "ممارسة مبنية على القانون والتعاون الدولي" : "Une pratique ancrée dans le droit et la coopération internationale"} />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <FactCard icon="briefcase" title={locale === "ar" ? "القانون الدولي" : "Droit international"} description={locale === "ar" ? "خبرة في الشؤون الدبلوماسية والقنصلية." : "Compétence en affaires diplomatiques et consulaires."} />
            <FactCard icon="globe" title={locale === "ar" ? "التكامل الأفريقي" : "Intégration africaine"} description={locale === "ar" ? "التزام بالحوار والتعاون الإقليمي." : "Engagement pour le dialogue et la coopération régionale."} />
            <FactCard icon="article" title={locale === "ar" ? "البحث والكتابة" : "Recherche et écriture"} description={locale === "ar" ? "تحليلات حول الحوكمة والسلام والتنمية." : "Analyses sur la gouvernance, la paix et le développement."} />
          </div>
        </MotionReveal>

        <MotionReveal delay={100}>
          <SectionHeading icon="briefcase" eyebrow={locale === "ar" ? "المسيرة" : "Parcours"} title={locale === "ar" ? "خبرات ومسؤوليات" : "Expériences et responsabilités"} action={{ href: `/${locale}/career`, label: locale === "ar" ? "عرض المسيرة" : "Voir le parcours" }} />
          <ul className="mt-8 grid gap-3 md:grid-cols-2" aria-label={locale === "ar" ? "أبرز المسيرة" : "Temps forts du parcours"}>
            {(positions.length ? positions.slice(0, 4).map((position) => ({
              id: position.slug,
              title: locale === "ar" ? position.titleAr : position.titleFr,
              detail: `${position.institution} · ${displayDate(position.startDate, locale)}`,
            })) : [
              { id: "international-law", title: locale === "ar" ? "القانون الدولي والعام" : "Droit public et international", detail: locale === "ar" ? "جامعة ياوندي الثانية" : "Université de Yaoundé II / SOA" },
              { id: "diplomacy", title: locale === "ar" ? "الشؤون الدبلوماسية والقنصلية" : "Affaires diplomatiques et consulaires", detail: locale === "ar" ? "مسار مهني دولي" : "Parcours international" },
            ]).map((item) => (
              <li key={item.id} className="flex gap-3 rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5 shadow-[0_12px_30px_rgba(4,22,46,0.05)]">
                <ProfileIcon name="arrow" className="mt-1 h-5 w-5 shrink-0 text-[#7b5800]" />
                <div><p className="font-semibold text-[#04162e]">{item.title}</p><p className="mt-1 text-sm text-[#44474d]">{item.detail}</p></div>
              </li>
            ))}
          </ul>
        </MotionReveal>

        <MotionReveal delay={120}>
          <SectionHeading icon="article" eyebrow={locale === "ar" ? "كتابات" : "Écrits"} title={locale === "ar" ? "مقالات وتحليلات" : "Articles et analyses"} action={{ href: `/${locale}/articles`, label: locale === "ar" ? "كل المقالات" : "Tous les articles" }} />
          <PreviewList emptyLabel={locale === "ar" ? "ستظهر المقالات المنشورة هنا." : "Les articles publiés apparaîtront ici."} items={articles.slice(0, 3).map((article) => ({ href: `/${locale}/articles/${article.slug}`, title: locale === "ar" ? article.titleAr : article.titleFr, detail: displayDate(article.publishedDate, locale) }))} />
        </MotionReveal>

        <MotionReveal delay={140}>
          <SectionHeading icon="gallery" eyebrow={locale === "ar" ? "الصور" : "Images"} title={locale === "ar" ? "معرض الصور" : "Galerie"} action={{ href: `/${locale}/gallery`, label: locale === "ar" ? "عرض المعرض" : "Voir la galerie" }} />
          {galleryPreview.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {galleryPreview.map((photo) => <Link key={photo.id} href={`/${locale}/gallery`} className="group overflow-hidden rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white"><img src={photo.src} alt="" className="aspect-[4/3] w-full object-cover outline outline-1 outline-black/10 transition-transform duration-200 group-hover:scale-[1.02]" /><p className="p-4 text-sm font-medium text-[#04162e]">{photo.caption}</p></Link>)}
            </div>
          ) : <EmptyPanel label={locale === "ar" ? "ستظهر الصور التي تنشر عبر البوابة هنا." : "Les photos publiées depuis le Portail apparaîtront ici."} />}
        </MotionReveal>

        <MotionReveal delay={160}>
          <SectionHeading icon="globe" eyebrow={locale === "ar" ? "مشاركات" : "Participations"} title={locale === "ar" ? "فعاليات ومشاركات" : "Événements et participations"} action={{ href: `/${locale}/participations`, label: locale === "ar" ? "كل المشاركات" : "Toutes les participations" }} />
          <PreviewList emptyLabel={locale === "ar" ? "ستظهر المشاركات المنشورة هنا." : "Les participations publiées apparaîtront ici."} items={participations.slice(0, 3).map((participation) => ({ href: `/${locale}/participations/${participation.slug}`, title: locale === "ar" ? participation.titleAr : participation.titleFr, detail: locale === "ar" ? participation.institutionAr : participation.institutionFr }))} />
        </MotionReveal>

        <MotionReveal delay={180}>
          <SectionHeading icon="calendar" eyebrow={locale === "ar" ? "القادم" : "À venir"} title={locale === "ar" ? "الفعاليات القادمة" : "Prochains événements"} action={{ href: `/${locale}/events`, label: locale === "ar" ? "كل الفعاليات" : "Tous les événements" }} />
          <PreviewList emptyLabel={locale === "ar" ? "لا توجد فعاليات قادمة منشورة." : "Aucun événement à venir n’est publié."} items={upcomingEvents.slice(0, 3).map((event) => ({ href: `/${locale}/events/${event.slug}`, title: locale === "ar" ? event.titleAr : event.titleFr, detail: displayDate(event.eventDate, locale) }))} />
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}`} />
    </>
  );
}

function SectionHeading({ icon, eyebrow, title, action }: { icon: Parameters<typeof ProfileIcon>[0]["name"]; eyebrow: string; title: string; action?: { href: string; label: string } }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#7b5800]"><ProfileIcon name={icon} className="h-4 w-4" />{eyebrow}</p><h2 className="mt-3 text-balance font-serif text-3xl font-semibold text-[#04162e]">{title}</h2></div>{action ? <Link href={action.href} className="rounded border border-[#7b5800] px-4 py-2 text-sm font-semibold text-[#04162e] transition-[scale,background-color] duration-150 ease-out hover:bg-[#ffdea6] active:scale-[0.96]">{action.label}</Link> : null}</div>;
}

function FactCard({ icon, title, description }: { icon: Parameters<typeof ProfileIcon>[0]["name"]; title: string; description: string }) {
  return <article className="rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5 shadow-[0_12px_30px_rgba(4,22,46,0.05)]"><ProfileIcon name={icon} className="h-6 w-6 text-[#7b5800]" /><h3 className="mt-5 font-serif text-xl font-semibold text-[#04162e]">{title}</h3><p className="mt-2 text-pretty text-sm leading-6 text-[#44474d]">{description}</p></article>;
}

function PreviewList({ items, emptyLabel }: { items: Array<{ href: string; title: string; detail: string }>; emptyLabel: string }) {
  if (!items.length) return <EmptyPanel label={emptyLabel} />;
  return <ul className="mt-8 grid gap-3 md:grid-cols-3">{items.map((item) => <li key={item.href}><Link href={item.href} className="block h-full rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5 shadow-[0_12px_30px_rgba(4,22,46,0.05)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(4,22,46,0.1)] active:scale-[0.96]"><p className="text-pretty font-semibold text-[#04162e]">{item.title}</p><p className="mt-3 text-sm text-[#44474d]">{item.detail}</p></Link></li>)}</ul>;
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="mt-8 rounded border border-dashed border-[#75777e] bg-[#f3f4f5] p-5 text-pretty text-sm text-[#44474d]">{label}</p>;
}

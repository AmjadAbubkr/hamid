import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import profileImage from "../../../imgs/hamid4.jpg";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { ProfileIcon } from "@/components/profile-icons";
import { ArticleCard, EventRow, FactCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { SectionHeading } from "@/components/public/section-heading";
import { TimelineMini } from "@/components/public/timeline";
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
    ? { title: "دبلوماسي وسياسي تشادي", institution: "جمهورية تشاد", context: "مرسوم رقم 1005/PR/PM/MC/2026 - 22 مايو 2026" }
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
    .slice(0, 4)
    .flatMap((photo) => {
      const src = galleryPublicUrl(photo.storagePath);
      return src ? [{ id: photo.id, src, caption: locale === "ar" ? photo.captionAr : photo.captionFr }] : [];
    });

  const aboutParagraph = locale === "ar"
    ? "مسار مهني مكرس للقانون الدولي والشؤون الدبلوماسية والتعاون الإقليمي."
    : "Un parcours consacré au droit international, aux affaires diplomatiques et à la coopération régionale.";

  const careerItems = positions.length
    ? positions
        // Exclude the current position — it is already featured in the hero,
        // so showing it again in the "highlights" preview reads as duplication.
        .filter((position) => position.endDate !== null)
        .slice(0, 5)
        .map((position) => ({
          id: position.slug,
          title: locale === "ar" ? position.titleAr : position.titleFr,
          meta: `${position.institution} · ${displayDate(position.startDate, locale)}`,
          href: `/${locale}/career/${position.slug}` as const,
        }))
    : [
        { id: "international-law", title: locale === "ar" ? "القانون الدولي والشؤون الدبلوماسية والعامة" : "Droit public et international", meta: locale === "ar" ? "جامعة ياوندي / SOA" : "Université de Yaoundé II / SOA", href: `/${locale}/career` as const },
        { id: "diplomacy", title: locale === "ar" ? "الشؤون الدبلوماسية والقنصلية" : "Affaires diplomatiques et consulaires", meta: locale === "ar" ? "مسار مهني دولي" : "Parcours international", href: `/${locale}/career` as const },
      ];

  return (
    <>
      <main className="flex flex-1 flex-col w-full text-ink">
        {/* ---------------------------------------------------------------- Hero
          Two-column cinematic hero: a deep-navy title panel on the
          inline-start side and the portrait on the inline-end side. Instead
          of a hard vertical border between them, a soft gradient dissolves the
          navy into the photo's edge; the bottom fades every column into the
          warm page background so there is no visible seam to the body below.
        */}
        <PageEntrance className="relative w-full overflow-hidden bg-navy">
          <section
            aria-label={locale === "ar" ? "مقدمة" : "Introduction"}
            className="relative grid w-full lg:grid-cols-2"
          >
            {/* Inline-end column — portrait. Source order is photo-first so that
                when the grid stacks on mobile the portrait sits on top and the
                navy title panel below. On lg the desktop reading order is
                restored by overriding order below. */}
            <div className="relative z-0 order-1 min-h-[26rem] sm:min-h-[32rem] lg:order-2 lg:min-h-[44rem]">
              <Image
                src={profileImage}
                alt="Hamid Mahamat Azaz"
                priority
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </div>

            {/* Inline-start column — navy title panel. A ::after pseudo-element
                (see globals.css `.hero-fade-panel`) paints a soft linear
                gradient that extends slightly over the portrait column,
                dissolving the navy edge into the image without blurring or
                degrading the photo itself. On lg the desktop reading order is
                restored so the navy panel sits inline-start (left in LTR,
                right in RTL) and the portrait inline-end. */}
            <div className="hero-fade-panel relative order-2 z-10 flex flex-col justify-center gap-6 px-6 py-14 text-white sm:px-10 sm:py-20 lg:order-1 lg:py-28 lg:ps-16 lg:pe-12 [&>*]:relative">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-200">
                <ProfileIcon name="profile" className="h-4 w-4" />
                <span>
                  {locale === "ar" ? "الملف الرسمي" : "Profil public officiel"}
                </span>
              </p>
              <h1 className="text-balance font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">
                Hamid Mahamat <span className="uppercase text-gold-200">Azaz</span>
              </h1>
              <p className="max-w-md text-pretty text-xl leading-relaxed text-white/90">
                {aboutParagraph}
              </p>

              <dl className="mt-2 flex flex-col gap-2 border-t border-white/20 pt-6 sm:flex-row sm:items-end sm:gap-10">
                <div className="flex flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200">
                    <ProfileIcon name="briefcase" className="h-4 w-4" />
                    <span>
                      {locale === "ar" ? "المنصب الحالي" : "Fonction actuelle"}
                    </span>
                  </dt>
                  <dd className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                    {role.title}
                  </dd>
                  <dd className="text-base text-white/85">{role.institution}</dd>
                  {role.context ? (
                    <dd className="text-sm text-white/70">{role.context}</dd>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 sm:mt-0 sm:self-end">
                  <Link
                    href={`/${locale}/about`}
                    className="inline-flex items-center justify-center gap-2 rounded bg-white px-7 py-3.5 text-sm font-semibold text-navy shadow-[var(--shadow-ambient)] transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-soft)] hover:bg-gold-200 active:scale-[0.97]"
                  >
                    {locale === "ar" ? "استكشاف الملف" : "Découvrir le profil"}
                  </Link>
                  <Link
                    href={`/${locale}/career`}
                    className="inline-flex items-center justify-center gap-2 rounded border border-white/50 px-7 py-3.5 text-sm font-semibold text-white transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-soft)] hover:border-white hover:bg-white/10 active:scale-[0.97]"
                  >
                    {locale === "ar" ? "المسيرة" : "Parcours"}
                  </Link>
                </div>
              </dl>
            </div>
          </section>
        </PageEntrance>

        {/* About — three pillars of practice */}
        <HomeSection className="pt-16 sm:pt-24">
          <MotionReveal delay={60}>
            <SectionHeading
              icon="profile"
              eyebrow={locale === "ar" ? "نبذة" : "À propos"}
              title={
                locale === "ar"
                  ? "ممارسة مهنية حول القانون والشؤون الدبلوماسية والتعاون الإقليمي"
                  : "Une pratique ancrée dans le droit et la coopération internationale"
              }
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <FactCard
                icon="briefcase"
                title={locale === "ar" ? "القانون الدولي والشؤون الدبلوماسية" : "Droit international"}
                description={
                  locale === "ar"
                    ? "خبرة في الشؤون الدبلوماسية والقنصلية."
                    : "Compétence en affaires diplomatiques et consulaires."
                }
              />
              <FactCard
                icon="globe"
                title={locale === "ar" ? "التكامـل الأفريقي" : "Intégration africaine"}
                description={
                  locale === "ar"
                    ? "الالتزام بالحوار والتعاون الإقليمي."
                    : "Engagement pour le dialogue et la coopération régionale."
                }
              />
              <FactCard
                icon="article"
                title={locale === "ar" ? "البحث والكتابة" : "Recherche et écriture"}
                description={
                  locale === "ar"
                    ? "تحليلات حول الحوكمة والسلام والتنمية."
                    : "Analyses sur la gouvernance, la paix et le développement."
                }
              />
            </div>
          </MotionReveal>
        </HomeSection>

        {/* Career — mini timeline preview */}
        <HomeSection>
          <MotionReveal delay={80}>
            <SectionHeading
              icon="briefcase"
              eyebrow={locale === "ar" ? "المسيرة" : "Parcours"}
              title={
                locale === "ar"
                  ? "خبرات ومسؤوليات"
                  : "Expériences et responsabilités"
              }
              action={{ href: `/${locale}/career`, label: locale === "ar" ? "عرض المسيرة" : "Voir le parcours" }}
            />
            <div className="mt-10">
              <TimelineMini
                ariaLabel={locale === "ar" ? "أبرز المسيرة" : "Temps forts du parcours"}
                items={careerItems}
              />
            </div>
          </MotionReveal>
        </HomeSection>

        {/* Articles — editorial layout: one featured + remaining */}
        <HomeSection>
          <MotionReveal delay={100}>
            <SectionHeading
              icon="article"
              eyebrow={locale === "ar" ? "كتابات" : "Écrits"}
              title={locale === "ar" ? "مقالات وتحليلات" : "Articles et analyses"}
              action={{ href: `/${locale}/articles`, label: locale === "ar" ? "كل المقالات" : "Tous les articles" }}
            />
            <ArticlesPreview
              locale={locale}
              articles={articles.map((article) => ({
                href: `/${locale}/articles/${article.slug}`,
                title: locale === "ar" ? article.titleAr : article.titleFr,
                date: displayDate(article.publishedDate, locale),
                publishedInName: locale === "ar" ? article.publishedInNameAr : article.publishedInNameFr,
              }))}
            />
          </MotionReveal>
        </HomeSection>

        {/* Gallery — larger uniform aspect, useful hover. Distinct from Articles */}
        <HomeSection>
          <MotionReveal delay={120}>
            <SectionHeading
              icon="gallery"
              eyebrow={locale === "ar" ? "صور" : "Images"}
              title={locale === "ar" ? "معرض الصور" : "Galerie"}
              action={{ href: `/${locale}/gallery`, label: locale === "ar" ? "عرض المعرض" : "Voir la galerie" }}
            />
            {galleryPreview.length ? (
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {galleryPreview.map((photo, index) => (
                  <li
                    key={photo.id}
                    className={
                      index === 0
                        ? "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2"
                        : ""
                    }
                  >
                    <Link
                      href={`/${locale}/gallery`}
                      className="group relative block h-full w-full overflow-hidden rounded border border-line bg-surface shadow-[var(--shadow-ambient)]"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.caption || ""}
                        fill
                        sizes={
                          index === 0
                            ? "(min-width: 1024px) 50vw, 100vw"
                            : "(min-width: 640px) 25vw, 100vw"
                        }
                        className={
                          index === 0
                            ? "object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                            : "object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                        }
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/0 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                      <p className="absolute inset-x-0 bottom-0 p-5 text-pretty text-sm font-medium text-white">
                        {photo.caption}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-10">
                <EmptyState
                  icon="gallery"
                  heading={locale === "ar" ? "لا توجد صور بعد" : "Aucune image publiée"}
                  body={
                    locale === "ar"
                      ? "تظهر الصور التي تم نشرها عبر البوابة هنا."
                      : "Les photos publiées depuis le Portail apparaîtront ici."
                  }
                />
              </div>
            )}
          </MotionReveal>
        </HomeSection>

        {/* Participations — secondary timeline preview, distinct visual */}
        <HomeSection>
          <MotionReveal delay={140}>
            <SectionHeading
              icon="globe"
              eyebrow={locale === "ar" ? "مشاركات" : "Participations"}
              title={locale === "ar" ? "فعاليات ومشاركات" : "Événements et participations"}
              action={{ href: `/${locale}/participations`, label: locale === "ar" ? "كل المشاركات" : "Toutes les participations" }}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {participations.slice(0, 3).map((participation) => (
                <article
                  key={participation.slug}
                  className="flex h-full flex-col gap-2 border-s-2 border-gold-300 bg-surface p-6 shadow-[var(--shadow-ambient)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-ambient-hover)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                    {participation.eventDateLabel}
                  </p>
                  <h3 className="font-serif text-lg font-semibold leading-snug text-ink">
                    <Link
                      href={`/${locale}/participations/${participation.slug}`}
                      className="rounded hover:underline"
                    >
                      {locale === "ar" ? participation.titleAr : participation.titleFr}
                    </Link>
                  </h3>
                  <p className="text-sm text-ink-600">
                    {locale === "ar" ? participation.institutionAr : participation.institutionFr}
                  </p>
                </article>
              ))}
              {!participations.length ? (
                <EmptyState
                  icon="globe"
                  heading={locale === "ar" ? "لا توجد مشاركات منشورة" : "Aucune participation publiée"}
                  body={
                    locale === "ar"
                      ? "تظهر المشاركات المنشورة هنا."
                      : "Les participations publiées apparaîtront ici."
                  }
                />
              ) : null}
            </div>
          </MotionReveal>
        </HomeSection>

        {/* Upcoming events — engagement rows with prominent date */}
        <HomeSection className="pb-16 sm:pb-24">
          <MotionReveal delay={160}>
            <SectionHeading
              icon="calendar"
              eyebrow={locale === "ar" ? "قادم" : "À venir"}
              title={locale === "ar" ? "فعاليات قادمة" : "Événements à venir"}
              action={{ href: `/${locale}/events`, label: locale === "ar" ? "كل الفعاليات" : "Tous les événements" }}
            />
            <div className="mt-10 flex flex-col gap-4">
              {upcomingEvents.slice(0, 3).map((event) => {
                const formatted = new Intl.DateTimeFormat(
                  locale === "ar" ? "ar-TD" : "fr-TD",
                  { day: "numeric", month: "short", timeZone: "UTC" }
                ).format(new Date(`${event.eventDate}T00:00:00Z`));
                const [day, month] = formatted.split(" ");
                return (
                  <EventRow
                    key={event.slug}
                    href={`/${locale}/events/${event.slug}`}
                    date={day ?? displayDate(event.eventDate, locale)}
                    dateLabel={month ?? ""}
                    title={locale === "ar" ? event.titleAr : event.titleFr}
                    institution={
                      locale === "ar" ? event.institutionAr : event.institutionFr
                    }
                    location={locale === "ar" ? event.venueAr : event.venueFr}
                  />
                );
              })}
              {!upcomingEvents.length ? (
                <EmptyState
                  icon="calendar"
                  heading={
                    locale === "ar"
                      ? "لا توجد فعاليات قادمة"
                      : "Aucun événement à venir"
                  }
                  body={
                    locale === "ar"
                      ? "لا توجد فعاليات قادمة منشورة بعد."
                      : "Aucun événement à venir n'est publié pour l'instant."
                  }
                />
              ) : null}
            </div>
          </MotionReveal>
        </HomeSection>
      </main>
      <CanonicalFooter pathname={`/${locale}`} />
    </>
  );
}

/* Shared section wrapper — consistent horizontal padding + max width + vertical
   rhythm via --spacing-section (5rem on desktop, suffix reflected below for
   mobile). */
function HomeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 ${className}`.trim()}
      style={{ paddingBottom: "var(--spacing-section)", paddingTop: "var(--spacing-section)" }}
    >
      {children}
    </section>
  );
}

function ArticlesPreview({
  locale,
  articles,
}: {
  locale: LocaleCode;
  articles: Array<{ href: string; title: string; date: string; publishedInName: string | null }>;
}) {
  if (!articles.length) {
    return (
      <div className="mt-10">
        <EmptyState
          icon="article"
          heading={locale === "ar" ? "لا توجد مقالات منشورة" : "Aucun article publié"}
          body={
            locale === "ar"
              ? "تظهر المقالات المنشورة هنا."
              : "Les articles publiés apparaîtront ici."
          }
        />
      </div>
    );
  }
  const [featured, ...rest] = articles;
  const publishedInPrefix =
    locale === "ar" ? "نشر أصلاً في " : "Publié d'abord dans ";
  return (
    <div className="mt-10 flex flex-col gap-5">
      <ArticleCard
        featured
        href={featured.href}
        date={featured.date}
        title={featured.title}
        publishedIn={
          featured.publishedInName
            ? `${publishedInPrefix}${featured.publishedInName}`
            : null
        }
      />
      {rest.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <ArticleCard
              key={article.href}
              href={article.href}
              date={article.date}
              title={article.title}
              publishedIn={
                article.publishedInName
                  ? `${publishedInPrefix}${article.publishedInName}`
                  : null
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

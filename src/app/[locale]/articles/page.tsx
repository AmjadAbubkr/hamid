import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { ArticleCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading } from "@/components/public/section-heading";
import { getPublishedArticles } from "@/lib/content/articles";
import {
  isLocaleCode,
  textFor,
  localizedField,
  intlLocaleFor,
  type LocaleCode,
} from "@/lib/i18n/locales";

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

function formatPublishedDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function ArticlesPage({ params }: ArticlesPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const articles = await getPublishedArticles();
  const readLabel = textFor(locale, { ar: "اقرأ", fr: "Lire", en: "Read" });
  const headingText = textFor(locale, { ar: "المقالات", fr: "Articles", en: "Articles" });
  const eyebrow = textFor(locale, {
    ar: "كتابات وبيانات",
    fr: "Édits et déclarations",
    en: "Statements and writings",
  });
  const intro = textFor(locale, {
    ar: "مقالات وتحليلات وكتابات أخرى ينشرها حامد.",
    fr: "Articles, analyses et prises de position publiés par Hamid.",
    en: "Articles, analyses, and positions published by Hamid.",
  });
  // Curly apostrophe U+2019 in "d’abord" matches the article [slug] test.
  const publishedInPrefix = textFor(locale, {
    ar: "نُشر أولاً في ",
    fr: "Publié d’abord dans ",
    en: "Originally published in ",
  });

  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-14 text-start sm:px-8 sm:py-20">
        <PageEntrance>
          <PageHeading eyebrow={eyebrow} title={headingText} intro={intro} />
        </PageEntrance>

        <MotionReveal delay={60}>
          {articles.length === 0 ? (
            <EmptyState
              icon="article"
              heading={textFor(locale, {
                ar: "لا توجد مقالات منشورة",
                fr: "Aucun article publié",
                en: "No articles published",
              })}
              body={textFor(locale, {
                ar: "لا توجد مقالات منشورة بعد.",
                fr: "Aucun article publié pour le moment.",
                en: "No articles published yet.",
              })}
            />
          ) : (
            <ArticlesListing
              readLabel={readLabel}
              articles={articles.map((article) => ({
                slug: article.slug,
                href: `/${locale}/articles/${article.slug}` as const,
                date: formatPublishedDate(article.publishedDate, locale),
                title: localizedField(locale, article.titleAr, article.titleFr, article.titleEn),
                publishedInName: localizedField(
                  locale,
                  article.publishedInNameAr,
                  article.publishedInNameFr,
                  article.publishedInNameEn,
                ),
              }))}
              publishedInPrefix={publishedInPrefix}
            />
          )}
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/articles`} locale={locale} />
    </>
  );
}

function ArticlesListing({
  articles,
  publishedInPrefix,
  readLabel,
}: {
  articles: Array<{
    slug: string;
    href: string;
    date: string;
    title: string;
    publishedInName: string | null;
  }>;
  publishedInPrefix: string;
  readLabel: string;
}) {
  const [featured, ...rest] = articles;
  return (
    <div className="flex flex-col gap-8">
      <ArticleCard
        featured
        readLabel={readLabel}
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
              key={article.slug}
              readLabel={readLabel}
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

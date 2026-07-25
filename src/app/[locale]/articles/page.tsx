import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import { MotionReveal, PageEntrance } from "@/components/motion-reveal";
import { ArticleCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeading } from "@/components/public/section-heading";
import { getPublishedArticles } from "@/lib/content/articles";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

function formatPublishedDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
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
  const headingText = locale === "ar" ? "المقالات" : "Articles";
  const eyebrow = locale === "ar" ? "كتابات وبيانات" : "Édits et déclarations";
  const intro =
    locale === "ar"
      ? "مقالات وتحليلات وكتابات أخرى ينشرها حامد."
      : "Articles, analyses et prises de position publiés par Hamid.";
  const publishedInPrefix = locale === "ar" ? "نُشر أولاً في " : "Publié d’abord dans ";

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
              heading={locale === "ar" ? "لا توجد مقالات منشورة" : "Aucun article publié"}
              body={locale === "ar" ? "لا توجد مقالات منشورة بعد." : "Aucun article publié pour le moment."}
            />
          ) : (
            <ArticlesListing
              articles={articles.map((article) => ({
                slug: article.slug,
                href: `/${locale}/articles/${article.slug}` as const,
                date: formatPublishedDate(article.publishedDate, locale),
                title: locale === "ar" ? article.titleAr : article.titleFr,
                publishedInName:
                  locale === "ar" ? article.publishedInNameAr : article.publishedInNameFr,
              }))}
              publishedInPrefix={publishedInPrefix}
            />
          )}
        </MotionReveal>
      </main>
      <CanonicalFooter pathname={`/${locale}/articles`} />
    </>
  );
}

function ArticlesListing({
  articles,
  publishedInPrefix,
}: {
  articles: Array<{
    slug: string;
    href: string;
    date: string;
    title: string;
    publishedInName: string | null;
  }>;
  publishedInPrefix: string;
}) {
  const [featured, ...rest] = articles;
  return (
    <div className="flex flex-col gap-8">
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
              key={article.slug}
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

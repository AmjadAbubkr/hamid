import Link from "next/link";
import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
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

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {locale === "ar" ? "المقالات" : "Articles"}
        </h1>

        {articles.length === 0 ? (
          <p className="mt-4 text-zinc-600">
            {locale === "ar" ? "لا توجد مقالات منشورة بعد." : "Aucun article publié pour le moment."}
          </p>
        ) : (
          <ol className="mt-8 flex flex-col gap-5">
            {articles.map((article) => {
              const title = locale === "ar" ? article.titleAr : article.titleFr;
              const publishedInName = locale === "ar"
                ? article.publishedInNameAr
                : article.publishedInNameFr;

              return (
                <li key={article.slug}>
                  <article className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-5">
                    <p className="text-sm text-zinc-500">
                      {formatPublishedDate(article.publishedDate, locale)}
                    </p>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      <Link
                        href={`/${locale}/articles/${article.slug}`}
                        className="rounded-s-sm rounded-e-sm underline decoration-zinc-400 underline-offset-4"
                      >
                        {title}
                      </Link>
                    </h2>
                    {publishedInName ? (
                      <p className="text-sm text-zinc-600">
                        {locale === "ar" ? "نشر أولاً في " : "Publié d’abord dans "}
                        {publishedInName}
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <CanonicalFooter pathname={`/${locale}/articles`} />
    </>
  );
}

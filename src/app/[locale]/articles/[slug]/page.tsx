import { notFound } from "next/navigation";
import { CanonicalFooter } from "@/components/canonical-footer";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
} from "@/lib/content/articles";
import { isLocaleCode, LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { sanitizeArticleHtml } from "@/lib/articles/sanitize-article-html";
import { safeHttpUrl } from "@/lib/safe-http-url";

type ArticleDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();

  return LOCALES.flatMap((locale) =>
    articles.map((article) => ({ locale, slug: article.slug })),
  );
}

function formatPublishedDate(date: string, locale: LocaleCode) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TD" : "fr-TD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocaleCode(rawLocale)) notFound();

  const locale = rawLocale;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const title = locale === "ar" ? article.titleAr : article.titleFr;
  const body = sanitizeArticleHtml(locale === "ar" ? article.bodyAr : article.bodyFr);
  const publishedInName = locale === "ar"
    ? article.publishedInNameAr
    : article.publishedInNameFr;
  const publishedInUrl = safeHttpUrl(article.publishedInUrl);

  return (
    <>
      <main className="ps-6 pe-6 mx-auto w-full max-w-3xl flex-1 py-12 text-start">
        <article className="flex flex-col gap-5">
          <p className="text-sm text-zinc-500">
            {formatPublishedDate(article.publishedDate, locale)}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          {publishedInName ? (
            <p className="text-sm text-zinc-600">
              {locale === "ar" ? "نشر أولاً في " : "Publié d’abord dans "}
              {publishedInUrl ? (
                <a href={publishedInUrl} className="underline underline-offset-4" rel="noreferrer">
                  {publishedInName}
                </a>
              ) : publishedInName}
            </p>
          ) : null}
          <div
            className="leading-8 text-zinc-800 [&_a]:underline [&_a]:decoration-zinc-400 [&_a]:underline-offset-4 [&_blockquote]:border-s [&_blockquote]:border-zinc-300 [&_blockquote]:ps-4 [&_blockquote]:text-zinc-600 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ps-6"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </article>
      </main>
      <CanonicalFooter pathname={`/${locale}/articles/${article.slug}`} />
    </>
  );
}

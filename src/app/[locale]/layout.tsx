import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocaleCode, LOCALE_META, textFor } from "@/lib/i18n/locales";
import { LocaleDocumentDirector } from "@/components/locale-document-director";
import { PublicNavigation } from "@/components/public/public-navigation";

export function generateStaticParams() {
  return [
    { locale: "ar" },
    { locale: "fr" },
    { locale: "en" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocaleCode(locale)) return {};
  const meta = LOCALE_META[locale];
  return {
    title: `Hamid — ${meta.name}`,
    description: textFor(locale, {
      ar: "حامد — الملف الشخصي الرسمي",
      fr: "Hamid — profil officiel",
      en: "Hamid — official profile",
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocaleCode(locale)) {
    notFound();
  }

  return (
    <>
      <LocaleDocumentDirector />
      <PublicNavigation locale={locale} />
      <div className="flex flex-1 flex-col w-full">{children}</div>
    </>
  );
}

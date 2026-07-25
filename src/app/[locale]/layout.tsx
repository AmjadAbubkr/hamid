import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Libre_Caslon_Text,
  Source_Sans_3,
  Noto_Naskh_Arabic,
} from "next/font/google";
import { isLocaleCode, LOCALE_META } from "@/lib/i18n/locales";
import { LocaleDocumentDirector } from "@/components/locale-document-director";
import { PublicNavigation } from "@/components/public/public-navigation";
import "@/app/globals.css";

/*
  DESIGN.md typography: Libre Caslon Text for Latin display, Source Sans 3 for
  Latin body, and a high-contrast Naskh face for Arabic. We expose each as a CSS
  variable; globals.css routes them to --font-serif / --font-sans / --font-ar
  so the rest of the codebase never has to know which family is in use.
*/
const libreCaslon = Libre_Caslon_Text({
  variable: "--font-display",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return [
    { locale: "ar" },
    { locale: "fr" },
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
    description:
      locale === "ar"
        ? "حامد — الملف الشخصي الرسمي"
        : "Hamid — profil officiel",
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
  const { dir, htmlLang } = LOCALE_META[locale];

  return (
    <html
      dir={dir}
      lang={htmlLang}
      className={`${libreCaslon.variable} ${sourceSans.variable} ${notoNaskhArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleDocumentDirector />
        <PublicNavigation locale={locale} />
        <div className="flex flex-1 flex-col w-full">
          {children}
        </div>
      </body>
    </html>
  );
}

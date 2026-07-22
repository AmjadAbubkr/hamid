import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isLocaleCode, LOCALE_META } from "@/lib/i18n/locales";
import { CanonicalFooter } from "@/components/canonical-footer";
import { LocaleDocumentDirector } from "@/components/locale-document-director";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        ? "حميد — الملف الشخصي الرسمي"
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleDocumentDirector />
        <div className="flex flex-1 flex-col w-full">
          {children}
          <CanonicalFooter />
        </div>
      </body>
    </html>
  );
}

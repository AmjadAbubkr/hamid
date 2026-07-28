import type { Metadata } from "next";
import {
  Libre_Caslon_Text,
  Source_Sans_3,
  Noto_Naskh_Arabic,
} from "next/font/google";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Hamid — Personal Public Profile",
  description:
    "The official online presence of Hamid, a Chadian diplomat and politician. Bilingual Profile in Arabic and French.",
};

/*
  Root layout owns the <html>/<body> shell — Next.js App Router requires these
  tags at the root. Sub-trees ([locale], portal/(normal), portal/(recovery))
  never render their own <html>; they return inner chrome only. The locale
  subtree patches `dir` and `lang` on the client via `LocaleDocumentDirector`
  so the SSR-emitted defaults below are a neutral fallback.

  Fonts are loaded here (not in [locale]/layout.tsx) so portal pages also get
  the same typography — globals.css routes --font-display / --font-body /
  --font-naskh to --font-serif / --font-sans / --font-ar regardless of
  subtree.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${libreCaslon.variable} ${sourceSans.variable} ${notoNaskhArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

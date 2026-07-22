import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hamid — Personal Public Profile",
  description:
    "The official online presence of Hamid, a Chadian diplomat and politician. Bilingual Profile in Arabic and French.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

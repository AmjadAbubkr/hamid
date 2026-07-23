import Link from "next/link";
import { ProfileIcon, type ProfileIconName } from "@/components/profile-icons";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import type { LocaleCode } from "@/lib/i18n/locales";

type PublicNavigationProps = {
  locale: LocaleCode;
};

const NAVIGATION_LABELS: Record<LocaleCode, Array<{ href: string; label: string; icon: ProfileIconName }>> = {
  ar: [
    { href: "/about", label: "نبذة", icon: "profile" },
    { href: "/career", label: "المسيرة", icon: "briefcase" },
    { href: "/articles", label: "المقالات", icon: "article" },
    { href: "/gallery", label: "المعرض", icon: "gallery" },
    { href: "/participations", label: "المشاركات", icon: "globe" },
    { href: "/events", label: "الفعاليات", icon: "calendar" },
  ],
  fr: [
    { href: "/about", label: "À propos", icon: "profile" },
    { href: "/career", label: "Parcours", icon: "briefcase" },
    { href: "/articles", label: "Articles", icon: "article" },
    { href: "/gallery", label: "Galerie", icon: "gallery" },
    { href: "/participations", label: "Participations", icon: "globe" },
    { href: "/events", label: "Événements", icon: "calendar" },
  ],
};

export function PublicNavigation({ locale }: PublicNavigationProps) {
  const homeLabel = locale === "ar" ? "حميد" : "Hamid";

  return (
    <header className="border-b border-[#c5c6ce] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-start">
        <Link
          href={`/${locale}`}
          className="font-serif text-xl font-semibold tracking-tight text-[#04162e]"
        >
          {homeLabel}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Navigation principale"}>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-[#04162e]">
              {NAVIGATION_LABELS[locale].map((item) => (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-sm px-1 py-1 underline-offset-4 transition-colors hover:text-[#7b5800] hover:underline"
                  >
                    <ProfileIcon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LocaleSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}

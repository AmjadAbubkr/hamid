"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const homeLabel = locale === "ar" ? "حامد" : "Hamid";
  const openLabel = locale === "ar" ? "فتح القائمة" : "Ouvrir le menu";
  const closeLabel = locale === "ar" ? "إغلاق القائمة" : "Fermer le menu";
  const navAriaLabel = locale === "ar" ? "التنقل الرئيسي" : "Navigation principale";

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-[#c5c6ce] bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 text-start">
        <Link
          href={`/${locale}`}
          className="font-serif text-xl font-semibold tracking-tight text-[#04162e]"
        >
          {homeLabel}
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label={navAriaLabel} className="hidden md:block">
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
          <div className="hidden md:block">
            <LocaleSwitcher locale={locale} />
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? closeLabel : openLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#7b5800] text-[#04162e] transition-transform duration-150 ease-out active:scale-[0.97] md:hidden"
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </div>

      <div
        ref={panelRef}
        id="mobile-nav-panel"
        data-open={open ? "" : undefined}
        className="mobile-nav-panel md:hidden"
      >
        <nav aria-label={navAriaLabel}>
          <ul className="flex flex-col gap-1 px-6 py-4 text-base font-medium text-[#04162e]">
            {NAVIGATION_LABELS[locale].map((item) => (
              <li key={item.href}>
                <Link
                  href={`/${locale}${item.href}`}
                  className="flex min-h-11 items-center gap-3 rounded-sm px-2 py-2.5 underline-offset-4 transition-colors active:scale-[0.98] hover:bg-[#f3f4f5] hover:text-[#7b5800]"
                >
                  <ProfileIcon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[#c5c6ce] px-6 py-4">
          <LocaleSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <span
        className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-150 ease-out ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProfileIcon, type ProfileIconName } from "@/components/profile-icons";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { SocialLinks } from "@/components/public/social-links";
import { textFor, type LocaleCode } from "@/lib/i18n/locales";

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
  en: [
    { href: "/about", label: "About", icon: "profile" },
    { href: "/career", label: "Career", icon: "briefcase" },
    { href: "/articles", label: "Articles", icon: "article" },
    { href: "/gallery", label: "Gallery", icon: "gallery" },
    { href: "/participations", label: "Participations", icon: "globe" },
    { href: "/events", label: "Events", icon: "calendar" },
  ],
};

export function PublicNavigation({ locale }: PublicNavigationProps) {
  const homeLabel = textFor(locale, { ar: "حامد", fr: "Hamid", en: "Hamid" });
  const subtitle = textFor(locale, { ar: "الملف الرسمي", fr: "Profil officiel", en: "Official profile" });
  const openLabel = textFor(locale, { ar: "فتح القائمة", fr: "Ouvrir le menu", en: "Open menu" });
  const closeLabel = textFor(locale, { ar: "إغلاق القائمة", fr: "Fermer le menu", en: "Close menu" });
  const navAriaLabel = textFor(locale, { ar: "التنقل الرئيسي", fr: "Navigation principale", en: "Main navigation" });

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // pinned -> the header shows the blurred translucent background + hairline
  // shadow after scrolling a few pixels. Pure smooth-scroll-feel transition.
  const [pinned, setPinned] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setPinned(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Route change closes the mobile panel (felt-correct even before the
  // redesign). Deferred to the next frame to keep setState out of the
  // synchronous effect body.
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const isActive = (href: string) => {
    const full = `/${locale}${href}`;
    if (href === "/about") return pathname === full;
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  return (
    <header
      className={[
        "sticky top-0 z-40 border-b border-line bg-surface",
        "transition-[background-color,box-shadow] duration-300",
        pinned ? "nav-blur--pinned" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 text-start sm:py-5">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3"
          aria-label={homeLabel}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-gold bg-surface text-gold transition-colors duration-300 ease-[var(--ease-soft)] group-hover:bg-gold-200/20"
          >
            <ProfileIcon name="profile" className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-ink">
              {homeLabel}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
              {subtitle}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label={navAriaLabel} className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium text-ink">
              {NAVIGATION_LABELS[locale].map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={`/${locale}${item.href}`}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors duration-200 ease-[var(--ease-soft)] hover:bg-surface-low hover:text-gold ${
                        active ? "bg-surface-low text-gold" : ""
                      }`}
                    >
                      <ProfileIcon
                        name={item.icon}
                        className={`h-4 w-4 ${active ? "text-gold" : "text-ink-600"}`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded border border-gold text-gold transition-transform duration-200 ease-[var(--ease-out-cubic)] active:scale-[0.97] md:hidden"
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
          <ul className="flex flex-col gap-1 px-6 py-4 text-base font-medium text-ink">
            {NAVIGATION_LABELS[locale].map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-sm px-3 py-3 underline-offset-4 transition-colors duration-200 ease-[var(--ease-soft)] active:scale-[0.98] hover:bg-surface-low ${
                      active ? "bg-surface-low text-gold" : ""
                    }`}
                  >
                    <ProfileIcon
                      name={item.icon}
                      className={`h-5 w-5 ${active ? "text-gold" : "text-ink-600"}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 flex items-center justify-between border-t border-line pt-4">
              <span className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                {textFor(locale, {
                  ar: "تابع",
                  fr: "Suivre",
                  en: "Follow",
                })}
              </span>
              <SocialLinks locale={locale} variant="nav" />
            </li>
          </ul>
        </nav>
        <div className="border-t border-line px-6 py-4">
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
        className={`absolute start-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`absolute start-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-150 ease-out ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute start-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

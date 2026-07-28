"use client";

import Link from "next/link";
import { PasskeyEnrollment, PortalLogout } from "@/components/portal/portal-auth-controls";
import { PortalFrame } from "@/components/portal/portal-frame";
import { usePortalLocale } from "@/components/portal/portal-locale-provider";

export default function PortalPage() {
  const { t } = usePortalLocale();
  return (
    <PortalFrame title="Logged in as Hamid / Editor">
      <p className="max-w-2xl text-base text-ink-700">{t("Manage the Content Items shown on the Profile. Draft changes remain private until you publish them.")}</p>
      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Portal content management">
        <Link href="/portal/positions" className="portal-dashboard-link">{t("Positions Held")}<span>{t("Career appointments")}</span></Link>
        <Link href="/portal/education" className="portal-dashboard-link">{t("Education Entries")}<span>{t("Qualifications and study")}</span></Link>
        <Link href="/portal/participations" className="portal-dashboard-link">{t("Past Participations")}<span>{t("Historical appearances")}</span></Link>
        <Link href="/portal/events" className="portal-dashboard-link">{t("Upcoming Events")}<span>{t("Future public engagements")}</span></Link>
        <Link href="/portal/articles" className="portal-dashboard-link">{t("Articles")}<span>{t("Op-eds and publications")}</span></Link>
        <Link href="/portal/gallery" className="portal-dashboard-link">{t("Gallery Photos")}<span>{t("Images and captions")}</span></Link>
        <Link href="/portal/tagline" className="portal-dashboard-link sm:col-span-2">{t("Profile Tagline")}<span>{t("The short introduction shown on the homepage")}</span></Link>
      </nav>
      <PasskeyEnrollment />
      <PortalLogout />
    </PortalFrame>
  );
}

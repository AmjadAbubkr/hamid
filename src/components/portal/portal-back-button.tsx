"use client";

import { usePathname, useRouter } from "next/navigation";
import { usePortalLocale } from "./portal-locale-provider";

export function portalBackHref(pathname: string) {
  if (pathname === "/portal" || pathname === "/portal/login") return "/ar";
  if (pathname === "/portal/recover") return "/portal/login";
  if (pathname === "/portal/re-enroll") return "/portal/recover";
  if (pathname === "/portal/tagline" || pathname === "/portal/recovery-code") return "/portal";

  const collection = pathname.match(/^\/portal\/(positions|education|participations|events|articles|gallery)(?:\/(.+))?$/);
  if (!collection) return "/portal";

  const [, section, item] = collection;
  if (!item) return "/portal";
  if (item.endsWith("/preview")) return `/portal/${section}/${item.slice(0, -"/preview".length)}`;
  return `/portal/${section}`;
}

export function PortalBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = usePortalLocale();

  function goBack() {
    router.replace(portalBackHref(pathname));
  }

  return (
    <button type="button" onClick={goBack} className="portal-back-button" aria-label={t("Go back")}>
      <span aria-hidden="true">←</span>
      {t("Back")}
    </button>
  );
}

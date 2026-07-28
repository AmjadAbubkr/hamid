"use client";

import type { ReactNode } from "react";
import { PortalBackButton } from "./portal-back-button";
import { usePortalLocale } from "./portal-locale-provider";

export function PortalFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { t } = usePortalLocale();
  return (
    <main className="portal-shell mx-auto my-6 flex w-full max-w-5xl flex-col gap-8 rounded-xl border border-line bg-surface p-6 shadow-ambient sm:my-10 sm:p-10" aria-labelledby="portal-title">
      <header className="flex flex-col gap-4 border-b border-line pb-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{t("Hamid / Portal")}</p>
          <PortalBackButton />
        </div>
        <h1 id="portal-title" className="font-serif text-3xl font-semibold tracking-tight text-ink">{t(title)}</h1>
      </header>
      {children}
    </main>
  );
}

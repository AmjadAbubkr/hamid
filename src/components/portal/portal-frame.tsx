import type { ReactNode } from "react";

export function PortalFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl p-6 flex flex-col gap-6" aria-labelledby="portal-title">
      <header className="flex flex-col gap-2 border-b border-line pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Hamid / Portal</p>
        <h1 id="portal-title" className="font-serif text-3xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
      </header>
      {children}
    </main>
  );
}

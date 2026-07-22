import type { ReactNode } from "react";

export function PortalFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="w-full max-w-xl p-6 flex flex-col gap-6" aria-labelledby="portal-title">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600">Hamid / Portal</p>
        <h1 id="portal-title" className="text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
      </header>
      {children}
    </main>
  );
}

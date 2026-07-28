"use client";

import { usePortalLocale } from "./portal-locale-provider";

export function PublishRequirements({ requirements }: { requirements: string[] }) {
  const { t } = usePortalLocale();
  if (requirements.length === 0) return null;

  return (
    <section role="status" className="rounded border border-gold-300 bg-surface-low p-4 text-sm text-ink-700" aria-live="polite">
      <p className="font-semibold text-ink">{t("Complete these before publishing:")}</p>
      <ul className="mt-2 list-disc space-y-1 ps-5">
        {requirements.map((requirement) => <li key={requirement}>{t(requirement)}</li>)}
      </ul>
    </section>
  );
}

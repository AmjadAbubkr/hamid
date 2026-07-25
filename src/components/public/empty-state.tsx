import type { ReactNode } from "react";
import { ProfileIcon, type ProfileIconName } from "@/components/profile-icons";

/*
  EmptyState â€” replaces the dashed placeholder that used to read as unfinished.
  A small gold icon, a short bilingual explanation, generous spacing. Used by
  every section that could be empty so the design language never breaks even
  before the Editor publishes anything.
*/
export function EmptyState({
  icon = "profile",
  heading,
  body,
  className,
}: {
  icon?: ProfileIconName;
  heading: string;
  body?: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex flex-col items-start gap-3 rounded bg-surface-low p-8 text-start",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-high text-gold">
        <ProfileIcon name={icon} className="h-5 w-5" />
      </span>
      <p className="text-pretty font-serif text-lg font-semibold text-ink">
        {heading}
      </p>
      {body ? (
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-ink-600">
          {body}
        </p>
      ) : null}
    </div>
  );
}

/*
  NullState â€” for the rare spot where an empty state should be inlined inline
  with prose (e.g. a sub-block of a section that itself has its own EmptyState).
  Quieter than EmptyState.
*/
export function QuietNullState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded bg-surface-low p-4 text-sm text-ink-600">{children}</p>
  );
}

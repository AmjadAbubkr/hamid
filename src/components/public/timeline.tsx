import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

/*
  Diplomatic timeline (DESIGN.md): a vertical 2px Navy line with gold nodes;
  institution clearly separated from title; dates visually secondary.

  Two variants:

  — Timeline (used by Career, About, home "Parcours" preview): the gold node
    sits on the inline-start of the spine so the entry's content flows in the
    natural reading direction and mirrors automatically in RTL.

  — TimelineMini (used on the home page as a compact "highlights" preview):
    the same spine, denser spacing, shorter drop cap. The two are different
    enough that sharing one component would force prop-soup; keeping them
    split keeps each implementation honest.
*/

export function Timeline({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className="flex flex-col gap-8 border-s-2 border-gold-300 ps-8 sm:ps-12"
    >
      {children}
    </ol>
  );
}

export function TimelineEntry({
  dateLabel,
  title,
  titleHref,
  meta,
  excerpt,
  presentBadge,
  badgeText,
}: {
  dateLabel: string;
  title: string;
  titleHref?: Route;
  meta?: ReactNode;
  excerpt?: ReactNode;
  presentBadge?: boolean;
  badgeText?: string;
}) {
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="absolute start-[-2.06rem] top-1.5 h-3.5 w-3.5 rounded-full bg-gold-300 ring-4 ring-bg"
        style={{ insetInlineStart: "-2.06rem" }}
      />
      <article className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
          {dateLabel}
        </p>
        <h3 className="font-serif text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {titleHref ? (
            <Link
              href={titleHref}
              className="rounded-s-sm rounded-e-sm underline decoration-line decoration-1 underline-offset-4 hover:decoration-gold"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {meta ? (
          <div className="text-[15px] leading-relaxed text-ink-700 [&_a]:underline">
            {meta}
          </div>
        ) : null}
        {excerpt ? (
          <p className="text-pretty leading-relaxed text-ink-600">{excerpt}</p>
        ) : null}
        {presentBadge ? (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-sm bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-navy">
            {badgeText}
          </span>
        ) : null}
      </article>
    </li>
  );
}

/*
  TimelineMini — denser vertical list, single gold node, no excerpt block.
  Used on the home page where the goal is a quick "highlights" glance, not a
  full read. Inherits the China gold navy spine language.
*/
export function TimelineMini({
  items,
  ariaLabel,
}: {
  items: Array<{
    id: string;
    title: string;
    meta: string;
    href?: Route;
  }>;
  ariaLabel?: string;
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className="flex flex-col gap-6 border-s-2 border-gold-300 ps-6"
    >
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute start-[-1.66rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-300 ring-4 ring-bg"
            style={{ insetInlineStart: "-1.66rem" }}
          />
          <article className="flex flex-col gap-1">
            <h3 className="text-[15px] font-semibold leading-snug text-ink">
              {item.href ? (
                <Link href={item.href} className="rounded hover:underline">
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h3>
            <p className="text-sm text-ink-600">{item.meta}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}

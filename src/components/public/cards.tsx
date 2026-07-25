import Link from "next/link";
import type { Route } from "next";
import { ProfileIcon, type ProfileIconName } from "@/components/profile-icons";

/*
  FactCard â€” used in the "About" area of the home page to summarise the three
  pillars of practice. Subtle top accent in gold (formal-card per DESIGN.md),
  ambient shadow, generous internal padding so each card breathes.
*/
export function FactCard({
  icon,
  title,
  description,
}: {
  icon: ProfileIconName;
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-full flex-col gap-4 rounded border border-line border-t-2 border-t-gold-300 bg-surface p-7 shadow-[var(--shadow-ambient)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-ambient-hover)]">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-low text-gold">
        <ProfileIcon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="text-pretty text-[15px] leading-relaxed text-ink-600">
        {description}
      </p>
    </article>
  );
}

/*
  ArticleCard — editorial treatment. Two sizes: featured (larger, two-column
  image + copy block) and standard (one-row). Both render a publication date
  eyebrow, a serif title, an excerpt, and a quiet reading CTA at the end.
  The CTA label is fully caller-provided so the same component renders in any
  Locale (`Lire` | `اقرأ` | `Read`).
*/
export function ArticleCard({
  href,
  date,
  title,
  excerpt,
  publishedIn,
  featured = false,
  readLabel = "Read",
}: {
  href: Route;
  date: string;
  title: string;
  excerpt?: string;
  publishedIn?: string | null;
  featured?: boolean;
  readLabel?: string;
}) {
  const label = `${readLabel} — ${title}`;
  if (featured) {
    return (
      <article className="group grid gap-0 overflow-hidden rounded border-line bg-surface shadow-[var(--shadow-ambient)] md:grid-cols-2">
        <div className="border-b border-line bg-surface-low md:border-b-0 md:border-e">
          {/* Featured uses a deep navy plate until the Editor pairs an image;
              it reads as an editorial cover rather than a placeholder. */}
          <div className="aspect-[16/10] w-full bg-gradient-to-br from-navy to-navy-700 sm:aspect-[16/9]" />
        </div>
        <div className="flex flex-col gap-4 p-7 md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            {date}
          </p>
          <h3 className="font-serif text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            <Link href={href} className="rounded hover:underline">
              {title}
            </Link>
          </h3>
          {excerpt ? (
            <p className="text-pretty leading-relaxed text-ink-700">{excerpt}</p>
          ) : null}
          {publishedIn ? (
            <p className="text-sm text-ink-600">
              {publishedIn}
            </p>
          ) : null}
          <Link
            href={href}
            aria-label={label}
            className="mt-auto inline-flex w-fit items-center gap-1.5 border-b border-transparent text-sm font-semibold text-ink transition-colors hover:border-gold"
          >
            {label}
            <ProfileIcon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </article>
    );
  }
  return (
    <article className="group flex h-full flex-col gap-3 border-t border-line bg-surface p-6 transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-ambient)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
        {date}
      </p>
      <h3 className="font-serif text-xl font-semibold leading-snug text-ink">
        <Link href={href} className="rounded hover:underline">
          {title}
        </Link>
      </h3>
      {excerpt ? (
        <p className="text-pretty text-sm leading-relaxed text-ink-600">{excerpt}</p>
      ) : null}
      {publishedIn ? (
        <p className="text-sm text-ink-600">{publishedIn}</p>
      ) : null}
      <Link
        href={href}
        aria-label={label}
        className="mt-auto inline-flex w-fit items-center gap-1.5 border-b border-transparent text-sm font-semibold text-ink transition-colors hover:border-gold"
      >
        {label}
        <ProfileIcon name="arrow" className="h-4 w-4" />
      </Link>
    </article>
  );
}

/*
  EventRow â€” official engagements. A prominent date block on the inline-start
  edge (gold-on-navy), the title and institution in the middle, a quiet CTA on
  the inline edge. The date stays the focal element even at small widths.
*/
export function EventRow({
  href,
  date,
  dateLabel,
  title,
  institution,
  location,
}: {
  href: Route;
  date: string;
  dateLabel: string;
  title: string;
  institution?: string;
  location?: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded border border-line bg-surface p-6 shadow-[var(--shadow-ambient)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-ambient-hover)] sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center gap-1 rounded bg-gold px-5 py-3 text-navy sm:w-24">
        <span className="font-serif text-2xl font-semibold leading-none">
          {date}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-700">
          {dateLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-serif text-xl font-semibold leading-snug text-ink">
          <Link href={href} className="rounded hover:underline">
            {title}
          </Link>
        </h3>
        {institution ? <p className="text-sm text-ink-700">{institution}</p> : null}
        {location ? (
          <p className="text-sm text-ink-600">{location}</p>
        ) : null}
      </div>
    </article>
  );
}

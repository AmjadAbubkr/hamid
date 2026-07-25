import Link from "next/link";
import type { Route } from "next";
import { ProfileIcon, type ProfileIconName } from "@/components/profile-icons";

/*
  SectionHeading â€” small caps eyebrow (gold), large serif title (navy),
  optional action link. Replaces the inline duplication present on the
  home page and the disconnected headings on inner pages. Same markup for
  every section, so vertical rhythm is uniform across the site.
*/

export function SectionHeading({
  icon,
  eyebrow,
  title,
  action,
  id,
}: {
  icon?: ProfileIconName;
  eyebrow: string;
  title: string;
  action?: { href: Route; label: string };
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="flex flex-col gap-3">
        {eyebrow ? (
          <p
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold"
            style={{ letterSpacing: "0.18em" }}
          >
            {icon ? <ProfileIcon name={icon} className="h-3.5 w-3.5" /> : null}
            <span>{eyebrow}</span>
          </p>
        ) : null}
        <h2
          id={id}
          className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl"
        >
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 border-b border-transparent text-sm font-semibold text-ink transition-colors duration-200 ease-[var(--ease-soft)] hover:border-gold"
        >
          {action.label}
          <ProfileIcon name="arrow" className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

/*
  PageHeading â€” the dominant title at the top of an inner page. Larger than
  a SectionHeading; optionally paired with an eyebrow and a short intro line.
*/
export function PageHeading({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  id?: string;
}) {
  return (
    <header className="flex flex-col gap-4">
      {eyebrow ? (
        <p
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold"
          style={{ letterSpacing: "0.18em" }}
        >
          <span /> {eyebrow}
        </p>
      ) : null}
      <h1
        id={id}
        className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl"
      >
        {title}
      </h1>
      {intro ? (
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-700">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

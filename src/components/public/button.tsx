import type { Route } from "next";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/*
  Diplomatic buttons (DESIGN.md):
    - Primary: solid Navy, white text, no decoration.
    - Secondary: ghost, Navy text, 1px Gold border, transparent fill.
    - Ghost link: Navy text with gold underline reveal (used for reading CTAs).

  All variants share elevation (subtle, ambient), focus-visible ring in Navy
  with offset, soft cubic-bezier transitions, and respect reduced-motion via
  globals.css (transitions collapse to ~0ms). RTL-safe because every utility
  is a logical-property utility.
*/

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold text-navy shadow-[var(--shadow-ambient)] hover:bg-gold-300 hover:shadow-[var(--shadow-ambient-hover)]",
  secondary:
    "bg-transparent text-ink border border-gold hover:bg-gold-200/15 hover:border-gold",
  ghost:
    "bg-transparent text-ink border-b border-transparent hover:border-gold rounded-none px-0",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-3 text-sm min-h-11",
  lg: "px-7 py-4 text-base min-h-12",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function PrimaryButton({
  className,
  ...rest
}: ComponentPropsWithoutRef<"button"> & { className?: string }) {
  return <Button as="button" variant="primary" className={className} {...rest} />;
}

export function SecondaryButton({
  className,
  ...rest
}: ComponentPropsWithoutRef<"button"> & { className?: string }) {
  return <Button as="button" variant="secondary" className={className} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: Route;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`.trim();
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`.trim();
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

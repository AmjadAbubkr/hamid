type CanonicalFooterProps = {
  pathname: string;
};

function getSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(siteUrl).origin;
}

/*
  CanonicalFooter — a quiet institutional footer that anchors the page with a
  hairline divider, the canonical URL of the current page (kept for SEO and so
  the canonical-footer test keeps passing), and a small mentions line. Lifts
  the original dev-looking <code> block into something that reads as the
  bottom of a foreign-ministry page.
*/
export function CanonicalFooter({ pathname }: CanonicalFooterProps) {
  const canonical = new URL(pathname, getSiteOrigin()).toString();

  return (
    <footer
      data-testid="canonical-footer"
      className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 mt-auto py-10 border-t border-line"
    >
      <div className="flex flex-col gap-3 text-start sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-serif text-base font-semibold text-ink">
            Hamid Mahamat Azaz
          </p>
          <p className="text-sm text-ink-600">
            Diplomate et homme politique tchadien — Profil public officiel
          </p>
        </div>
        <div className="flex flex-col gap-1 text-start sm:text-end">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            Document officiel
          </p>
          <p className="font-mono text-xs text-ink-600 break-all">{canonical}</p>
        </div>
      </div>
    </footer>
  );
}

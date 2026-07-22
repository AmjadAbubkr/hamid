type CanonicalFooterProps = {
  pathname: string;
};

function getSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(siteUrl).origin;
}

export function CanonicalFooter({ pathname }: CanonicalFooterProps) {
  const canonical = new URL(pathname, getSiteOrigin()).toString();

  return (
    <footer
      data-testid="canonical-footer"
      className="ps-4 pe-4 ms-2 me-2 mt-auto py-4 text-start"
    >
      <code className="font-mono text-xs text-zinc-500 break-all">
        {canonical}
      </code>
    </footer>
  );
}

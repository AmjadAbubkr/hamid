"use client";

import { usePathname } from "next/navigation";

export function CanonicalFooter() {
  const pathname = usePathname();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonical = `${origin}${pathname}`;

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

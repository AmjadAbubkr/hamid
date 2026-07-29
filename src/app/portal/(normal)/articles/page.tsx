import Link from "next/link";
import { ArticleList } from "@/components/portal/article-list";
import { PortalFrame } from "@/components/portal/portal-frame";
import { PortalText } from "@/components/portal/portal-locale-provider";

export default function ArticlesPage() {
  return (
    <PortalFrame title="Articles">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700"><PortalText>Create, publish, and update the Profile&apos;s site-original writing.</PortalText></p>
        <Link href="/portal/articles/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          <PortalText>New Article</PortalText>
        </Link>
      </div>
      <ArticleList />
    </PortalFrame>
  );
}

import Link from "next/link";
import { ArticleList } from "@/components/portal/article-list";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function ArticlesPage() {
  return (
    <PortalFrame title="Articles">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-700">Create, publish, and update the Profile&apos;s site-original writing.</p>
        <Link href="/portal/articles/new" className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white">
          New Article
        </Link>
      </div>
      <ArticleList />
    </PortalFrame>
  );
}

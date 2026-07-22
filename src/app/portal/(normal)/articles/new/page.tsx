import Link from "next/link";
import { ArticleForm } from "@/components/portal/article-form";
import { PortalFrame } from "@/components/portal/portal-frame";

export default function NewArticlePage() {
  return (
    <PortalFrame title="New Article">
      <Link href="/portal/articles" className="w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4">
        Back to Articles
      </Link>
      <ArticleForm />
    </PortalFrame>
  );
}

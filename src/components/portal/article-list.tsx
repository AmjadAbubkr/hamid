"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Article } from "./article-form";
import { usePortalLocale } from "./portal-locale-provider";

type ArticleListItem = Pick<Article, "id" | "slug" | "status" | "title_ar" | "title_fr" | "published_date">;

export function ArticleList() {
  const { t } = usePortalLocale();
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("article")
          .select("id, slug, status, title_ar, title_fr, published_date")
          .eq("author_editor_id", editorId)
          .order("published_date", { ascending: false, nullsFirst: false });
        if (error) throw error;

        if (active) {
          setItems((data ?? []) as ArticleListItem[]);
          setState("ready");
        }
      } catch {
        if (active) setState("error");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return <p className="text-zinc-700">{t("Loading Articles...")}</p>;
  if (state === "error") return <p role="alert" className="rounded bg-zinc-100 p-3 text-zinc-800">{t("Articles could not be loaded.")}</p>;
  if (items.length === 0) return <p className="rounded border border-dashed border-zinc-300 p-4 text-zinc-700">{t("No Articles yet.")}</p>;

  return (
    <ul className="flex flex-col gap-3" aria-label="Articles">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-950">{item.title_fr || item.title_ar || "Untitled Article"}</p>
            <p className="text-sm text-zinc-600">{item.published_date || "Original publication date not set"} · {item.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/portal/articles/${item.slug}`} className="text-zinc-950 underline underline-offset-4">{t("Edit")}</Link>
            <Link href={`/portal/articles/${item.slug}/preview`} className="text-zinc-950 underline underline-offset-4">{t("Preview")}</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

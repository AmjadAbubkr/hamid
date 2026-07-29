"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortalLocale } from "./portal-locale-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { GalleryPhoto } from "./gallery-form";

type GalleryListItem = Pick<GalleryPhoto, "id" | "slug" | "status" | "caption_ar" | "caption_fr" | "taken_date">;

export function GalleryList() {
  const { t } = usePortalLocale();
  const [items, setItems] = useState<GalleryListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("gallery_photo")
          .select("id, slug, status, caption_ar, caption_fr, taken_date")
          .eq("author_editor_id", editorId)
          .order("taken_date", { ascending: false, nullsFirst: false });
        if (error) throw error;
        if (active) {
          setItems((data ?? []) as GalleryListItem[]);
          setState("ready");
        }
      } catch {
        if (active) setState("error");
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (state === "loading") return <p className="text-ink-600">Loading Gallery Photos...</p>;
  if (state === "error") return <p role="alert" className="rounded border border-line bg-surface-low p-3 text-ink">Gallery Photos could not be loaded.</p>;
  if (items.length === 0) return <p className="rounded border border-dashed border-line-soft p-4 text-ink-600">No Gallery Photos yet.</p>;

  return (
    <ul className="flex flex-col gap-3" aria-label="Gallery Photos">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded border border-line border-t-2 border-t-gold-300 bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">{item.caption_fr || item.caption_ar || t("Untitled Gallery Photo")}</p>
            <p className="text-sm text-ink-700">{item.taken_date || t("Date not set")} · {item.status}</p>
          </div>
          <Link href={`/portal/gallery/${item.slug}`} className="text-sm font-semibold text-ink underline decoration-gold underline-offset-4">Edit</Link>
        </li>
      ))}
    </ul>
  );
}

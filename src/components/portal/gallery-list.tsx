"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { GalleryPhoto } from "./gallery-form";

type GalleryListItem = Pick<GalleryPhoto, "id" | "slug" | "status" | "caption_ar" | "caption_fr" | "taken_date">;

export function GalleryList() {
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

  if (state === "loading") return <p className="text-[#44474d]">Loading Gallery Photos...</p>;
  if (state === "error") return <p role="alert" className="rounded border border-[#c5c6ce] bg-[#f3f4f5] p-3 text-[#191c1d]">Gallery Photos could not be loaded.</p>;
  if (items.length === 0) return <p className="rounded border border-dashed border-[#75777e] p-4 text-[#44474d]">No Gallery Photos yet.</p>;

  return (
    <ul className="flex flex-col gap-3" aria-label="Gallery Photos">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[#04162e]">{item.caption_fr || item.caption_ar || "Untitled Gallery Photo"}</p>
            <p className="text-sm text-[#44474d]">{item.taken_date || "Date not set"} · {item.status}</p>
          </div>
          <Link href={`/portal/gallery/${item.slug}`} className="text-sm font-semibold text-[#04162e] underline decoration-[#7b5800] underline-offset-4">Edit</Link>
        </li>
      ))}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PositionHeld } from "./position-form";

type PositionListItem = Pick<PositionHeld, "id" | "slug" | "status" | "title_ar" | "title_fr" | "institution" | "start_date" | "end_date">;

export function PositionList() {
  const [items, setItems] = useState<PositionListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("position_held")
          .select("id, slug, status, title_ar, title_fr, institution, start_date, end_date")
          .eq("author_editor_id", editorId)
          .order("start_date", { ascending: false });
        if (error) throw error;

        if (active) {
          setItems((data ?? []) as PositionListItem[]);
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

  if (state === "loading") {
    return <p className="text-zinc-700">Loading Positions Held…</p>;
  }

  if (state === "error") {
    return <p role="alert" className="rounded bg-zinc-100 p-3 text-zinc-800">Positions Held could not be loaded.</p>;
  }

  if (items.length === 0) {
    return <p className="rounded border border-dashed border-zinc-300 p-4 text-zinc-700">No Positions Held yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Positions Held">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-950">{item.title_fr || item.title_ar || "Untitled Position Held"}</p>
            <p className="text-sm text-zinc-700">{item.institution || "Institution not set"}</p>
            <p className="text-sm text-zinc-600">{positionDates(item)}</p>
            <p className="text-sm font-medium capitalize text-zinc-700">{item.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/portal/positions/${item.slug}`} className="text-zinc-950 underline underline-offset-4">
              Edit
            </Link>
            <Link href={`/portal/positions/${item.slug}/preview`} className="text-zinc-950 underline underline-offset-4">
              Preview
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function positionDates(item: PositionListItem): string {
  if (!item.start_date) return "Dates not set";
  return item.end_date ? `${item.start_date} – ${item.end_date}` : `${item.start_date} – present`;
}

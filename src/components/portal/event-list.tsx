"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getParticipationRoleEditorLabel } from "@/lib/content/participation-roles";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { UpcomingEvent } from "./event-form";

type EventListItem = Pick<UpcomingEvent, "id" | "slug" | "status" | "title_ar" | "title_fr" | "institution_ar" | "institution_fr" | "event_date" | "role">;

export function EventList() {
  const [items, setItems] = useState<EventListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("upcoming_event")
          .select("id, slug, status, title_ar, title_fr, institution_ar, institution_fr, event_date, role")
          .eq("author_editor_id", editorId)
          .order("event_date", { ascending: true });
        if (error) throw error;

        if (active) {
          setItems((data ?? []) as EventListItem[]);
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

  if (state === "loading") return <p className="text-zinc-700">Loading Upcoming Events...</p>;
  if (state === "error") {
    return <p role="alert" className="rounded bg-zinc-100 p-3 text-zinc-800">Upcoming Events could not be loaded.</p>;
  }
  if (items.length === 0) {
    return <p className="rounded border border-dashed border-zinc-300 p-4 text-zinc-700">No Upcoming Events yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Upcoming Events">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-950">{item.title_fr || item.title_ar || "Untitled Upcoming Event"}</p>
            <p className="text-sm text-zinc-700">{item.institution_fr || item.institution_ar || "Institution not set"}</p>
            <p className="text-sm text-zinc-600">{item.event_date || "Event date not set"}</p>
            <p className="text-sm font-medium text-zinc-700">{item.role ? getParticipationRoleEditorLabel(item.role) : "Role not set"} - {item.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/portal/events/${item.slug}`} className="text-zinc-950 underline underline-offset-4">Edit</Link>
            <Link href={`/portal/events/${item.slug}/preview`} className="text-zinc-950 underline underline-offset-4">Preview</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

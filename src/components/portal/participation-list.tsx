"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortalLocale } from "./portal-locale-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PastParticipation } from "./participation-form";

type ParticipationListItem = Pick<PastParticipation, "id" | "slug" | "status" | "title_ar" | "title_fr" | "institution_ar" | "institution_fr" | "role" | "event_date_label">;

export function ParticipationList() {
  const { t } = usePortalLocale();
  const [items, setItems] = useState<ParticipationListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("past_participation")
          .select("id, slug, status, title_ar, title_fr, institution_ar, institution_fr, role, event_date_label")
          .eq("author_editor_id", editorId)
          .order("event_date", { ascending: false });
        if (error) throw error;

        if (active) {
          setItems((data ?? []) as ParticipationListItem[]);
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

  if (state === "loading") return <p className="text-zinc-700">Loading Past Participations...</p>;
  if (state === "error") {
    return <p role="alert" className="rounded bg-zinc-100 p-3 text-zinc-800">Past Participations could not be loaded.</p>;
  }
  if (items.length === 0) {
    return <p className="rounded border border-dashed border-zinc-300 p-4 text-zinc-700">No Past Participations yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Past Participations">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-950">{item.title_fr || item.title_ar || t("Untitled Past Participation")}</p>
            <p className="text-sm text-zinc-700">{item.institution_fr || item.institution_ar || t("Institution not set")}</p>
            <p className="text-sm text-zinc-600">{item.event_date_label || t("Event date not set")}</p>
            <p className="text-sm font-medium text-zinc-700">{item.role || t("Role not set")} - {item.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/portal/participations/${item.slug}`} className="text-zinc-950 underline underline-offset-4">Edit</Link>
            <Link href={`/portal/participations/${item.slug}/preview`} className="text-zinc-950 underline underline-offset-4">Preview</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

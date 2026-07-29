"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortalLocale } from "./portal-locale-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EducationEntry } from "./education-form";

type EducationListItem = Pick<EducationEntry, "id" | "slug" | "status" | "degree_ar" | "degree_fr" | "institution_ar" | "institution_fr" | "start_date" | "end_date">;

export function EducationList() {
  const { t } = usePortalLocale();
  const [items, setItems] = useState<EducationListItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data: editorId, error: editorError } = await supabase.rpc("current_editor_id");
        if (editorError || typeof editorId !== "string") throw editorError ?? new Error("Editor access was not found.");

        const { data, error } = await supabase
          .from("education_entry")
          .select("id, slug, status, degree_ar, degree_fr, institution_ar, institution_fr, start_date, end_date")
          .eq("author_editor_id", editorId)
          .order("end_date", { ascending: false });
        if (error) throw error;

        if (active) {
          setItems((data ?? []) as EducationListItem[]);
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

  if (state === "loading") return <p className="text-zinc-700">Loading Education Entries...</p>;
  if (state === "error") {
    return <p role="alert" className="rounded bg-zinc-100 p-3 text-zinc-800">Education Entries could not be loaded.</p>;
  }
  if (items.length === 0) {
    return <p className="rounded border border-dashed border-zinc-300 p-4 text-zinc-700">No Education Entries yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Education Entries">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-950">{item.degree_fr || item.degree_ar || t("Untitled Education Entry")}</p>
            <p className="text-sm text-zinc-700">{item.institution_fr || item.institution_ar || t("Institution not set")}</p>
            <p className="text-sm text-zinc-600">{educationDates(item, t)}</p>
            <p className="text-sm font-medium capitalize text-zinc-700">{item.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/portal/education/${item.slug}`} className="text-zinc-950 underline underline-offset-4">
              Edit
            </Link>
            <Link href={`/portal/education/${item.slug}/preview`} className="text-zinc-950 underline underline-offset-4">
              Preview
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function educationDates(item: EducationListItem, t: (english: string) => string): string {
  if (!item.start_date || !item.end_date) return t("Dates not set");
  return `${item.start_date} - ${item.end_date}`;
}

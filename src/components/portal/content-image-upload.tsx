"use client";

import type { ChangeEvent } from "react";
import { usePortalLocale } from "./portal-locale-provider";

export type ContentImageType = "upcoming_event" | "past_participation";

export async function uploadContentImage(itemType: ContentImageType, id: string, file: File) {
  const data = new FormData();
  data.set("itemType", itemType); data.set("id", id); data.set("image", file);
  const response = await fetch("/api/portal/content-image", { method: "POST", body: data });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "The image could not be uploaded.");
  }
}

export function ContentImageUpload({ file, onFileChange, disabled }: { file: File | null; onFileChange: (file: File | null) => void; disabled?: boolean }) {
  const { t } = usePortalLocale();
  return <section className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-white p-4">
    <div><h2 className="font-semibold text-zinc-950">{t("Optional image")}</h2><p className="text-sm text-zinc-600">{t("JPEG, PNG, or WebP up to 8 MB. It uploads when you save.")}</p></div>
    <input aria-label={t("Optional image")} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event: ChangeEvent<HTMLInputElement>) => onFileChange(event.target.files?.[0] ?? null)} />
    {file ? <p className="text-sm text-zinc-700">{t("Selected:")} {file.name}</p> : null}
  </section>;
}

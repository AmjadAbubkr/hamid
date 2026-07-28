"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContentTable = "article" | "position_held" | "education_entry" | "past_participation" | "upcoming_event" | "gallery_photo";

export function DeleteContentButton({ itemType, id, returnTo }: { itemType: ContentTable; id: string; returnTo: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    if (!window.confirm("Delete this item permanently? This cannot be undone.")) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/content", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemType, id }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "The item could not be deleted.");
      router.replace(returnTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The item could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return <div className="flex flex-col gap-2"><button type="button" onClick={() => void remove()} disabled={deleting} className="rounded border border-red-300 px-4 py-2 font-semibold text-red-300 disabled:opacity-60">{deleting ? "Deleting…" : "Delete"}</button>{message ? <p role="alert" className="text-sm text-red-300">{message}</p> : null}</div>;
}

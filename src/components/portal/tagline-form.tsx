"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Tagline = {
  id: string;
  status: "draft" | "published";
  tagline_ar: string;
  tagline_fr: string;
};

function isFilled(value: string) {
  return value.trim().length > 0;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function TaglineForm() {
  const router = useRouter();
  const [tagline, setTagline] = useState<Tagline | null>(null);
  const [taglineAr, setTaglineAr] = useState("");
  const [taglineFr, setTaglineFr] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const canPublish = Boolean(tagline) && isFilled(taglineAr) && isFilled(taglineFr);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/portal/tagline", { cache: "no-store" });
        const result = await response.json() as { error?: string; tagline?: Tagline };
        if (!response.ok || !result.tagline) throw new Error(result.error ?? "The Tagline could not be loaded.");
        if (active) {
          setTagline(result.tagline);
          setTaglineAr(result.tagline.tagline_ar);
          setTaglineFr(result.tagline.tagline_fr);
          setState("ready");
        }
      } catch (error) {
        if (active) {
          setMessage(messageFor(error, "The Tagline could not be loaded."));
          setState("error");
        }
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save("save");
  }

  async function save(action: "save" | "publish") {
    if (!tagline) return;
    setMessage("");
    if (action === "publish") setPublishing(true);
    else setSaving(true);

    try {
      const response = await fetch("/api/portal/tagline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tagline_ar: taglineAr, tagline_fr: taglineFr, action }),
      });
      const result = await response.json() as { error?: string; tagline?: Tagline };
      if (!response.ok || !result.tagline) throw new Error(result.error ?? "The Tagline could not be saved.");

      setTagline(result.tagline);
      setMessage(action === "publish"
        ? "Published. The Profile will update after its deployment completes."
        : "Saved as a draft. Publish when both Locale sentences are ready.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "The Tagline could not be saved."));
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  if (state === "loading") return <p className="text-[#44474d]">Loading the Tagline...</p>;
  if (state === "error") return <p role="alert" className="rounded border border-[#c5c6ce] bg-[#f3f4f5] p-3 text-[#191c1d]">{message}</p>;

  return (
    <form className="flex flex-col gap-8" onSubmit={submit}>
      <section className="rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5">
        <h2 className="font-serif text-xl font-semibold text-[#04162e]">The Profile&apos;s one-line introduction</h2>
        <p className="mt-2 text-sm leading-6 text-[#44474d]">This is the only Tagline. It is not a free-text Bio, and the About page assembles the rest from structured Content Items.</p>
        <p className="mt-3 text-sm text-[#44474d]">Status: {tagline?.status}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <LocaleField locale="Arabic" direction="rtl" value={taglineAr} onChange={setTaglineAr} />
        <LocaleField locale="French" direction="ltr" value={taglineFr} onChange={setTaglineFr} />
      </div>

      {message ? <p role="alert" className="rounded border border-[#c5c6ce] bg-[#f3f4f5] p-3 text-sm text-[#191c1d]">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing} className="rounded bg-[#04162e] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : "Save as draft"}
        </button>
        <button type="button" disabled={!canPublish || saving || publishing} onClick={() => void save("publish")} className="rounded border border-[#7b5800] px-4 py-2 font-semibold text-[#04162e] disabled:cursor-not-allowed disabled:opacity-60">
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
      <p className="text-sm text-[#44474d]">There is no New, list, or delete action: the Tagline is a single protected record.</p>
    </form>
  );
}

function LocaleField({
  locale,
  direction,
  value,
  onChange,
}: {
  locale: "Arabic" | "French";
  direction: "rtl" | "ltr";
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `tagline-${locale.toLowerCase()}`;
  return (
    <section dir={direction} className="rounded border border-[#c5c6ce] border-t-2 border-t-[#fdc34d] bg-white p-5">
      <label className="flex flex-col gap-3 text-sm font-semibold text-[#04162e]" htmlFor={id}>
        {locale} Tagline
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 border-b border-[#75777e] bg-transparent px-1 py-2 text-base leading-7 text-[#191c1d] outline-none focus:border-b-2 focus:border-[#7b5800]"
          maxLength={240}
        />
      </label>
      <p className="mt-2 text-sm text-[#44474d]">Keep it concise: one sentence that introduces Hamid in this Locale.</p>
    </section>
  );
}

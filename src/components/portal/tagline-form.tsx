"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PublishRequirements } from "./publish-requirements";
import { usePortalLocale } from "./portal-locale-provider";

type Tagline = {
  id: string;
  status: "draft" | "published";
  tagline_ar: string;
  tagline_fr: string;
  tagline_en: string;
};

function isFilled(value: string) {
  return value.trim().length > 0;
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function TaglineForm() {
  const router = useRouter();
  const { t } = usePortalLocale();
  const [tagline, setTagline] = useState<Tagline | null>(null);
  const [taglineAr, setTaglineAr] = useState("");
  const [taglineFr, setTaglineFr] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const canPublish = Boolean(tagline) && isFilled(taglineAr) && isFilled(taglineFr) && isFilled(taglineEn);
  const publishRequirements = [
    !tagline ? t("Wait for the Tagline to load.") : "",
    !isFilled(taglineAr) ? t("Arabic Tagline") : "",
    !isFilled(taglineFr) ? t("French Tagline") : "",
    !isFilled(taglineEn) ? t("English Tagline") : "",
  ].filter(Boolean);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/portal/tagline", { cache: "no-store" });
        if (!response.ok) {
          const result = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(result?.error ?? t("The Tagline could not be loaded."));
        }
        const result = await response.json() as { error?: string; tagline?: Tagline };
        if (!result.tagline) throw new Error(result.error ?? t("The Tagline could not be loaded."));
        if (active) {
          setTagline(result.tagline);
          setTaglineAr(result.tagline.tagline_ar);
          setTaglineFr(result.tagline.tagline_fr);
          setTaglineEn(result.tagline.tagline_en ?? "");
          setState("ready");
        }
      } catch (error) {
        if (active) {
          setMessage(messageFor(error, t("The Tagline could not be loaded.")));
          setState("error");
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [t]);

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
        body: JSON.stringify({ tagline_ar: taglineAr, tagline_fr: taglineFr, tagline_en: taglineEn, action }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? t("The Tagline could not be saved."));
      }
      const result = await response.json() as { error?: string; tagline?: Tagline };
      if (!result.tagline) throw new Error(result.error ?? t("The Tagline could not be saved."));

      setTagline(result.tagline);
      setMessage(action === "publish"
        ? "Published. The Profile will update after its deployment completes."
        : "Saved as a draft. Publish when all Locale sentences are ready.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, t("The Tagline could not be saved.")));
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  if (state === "loading") return <p className="text-ink-600">{t("Loading the Tagline...")}</p>;
  if (state === "error") return <p role="alert" className="rounded border border-line bg-surface-low p-3 text-ink">{message}</p>;

  return (
    <form className="flex flex-col gap-8" onSubmit={submit}>
      <section className="rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">{t("The Profile's one-line introduction")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-700">{t("This is the only Tagline. It is not a free-text Bio, and the About page assembles the rest from structured Content Items.")}</p>
        <p className="mt-3 text-sm text-ink-700">{t("Status:")} {tagline ? t(tagline.status) : ""}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <LocaleField locale="Arabic" direction="rtl" value={taglineAr} onChange={setTaglineAr} />
        <LocaleField locale="French" direction="ltr" value={taglineFr} onChange={setTaglineFr} />
        <LocaleField locale="English" direction="ltr" value={taglineEn} onChange={setTaglineEn} />
      </div>

      {message ? <p role="alert" className="rounded border border-line bg-surface-low p-3 text-sm text-ink">{message}</p> : null}
      <PublishRequirements requirements={publishRequirements} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing} className="rounded bg-gold px-4 py-2 font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? t("Saving...") : t("Save as draft")}
        </button>
        <button type="button" disabled={!canPublish || saving || publishing} onClick={() => void save("publish")} className="rounded border border-gold px-4 py-2 font-semibold text-gold disabled:cursor-not-allowed disabled:opacity-60">
          {publishing ? t("Publishing...") : t("Publish")}
        </button>
      </div>
      <p className="text-sm text-ink-700">{t("There is no New, list, or delete action: the Tagline is a single protected record.")}</p>
    </form>
  );
}

function LocaleField({
  locale,
  direction,
  value,
  onChange,
}: {
  locale: "Arabic" | "French" | "English";
  direction: "rtl" | "ltr";
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = usePortalLocale();
  const id = `tagline-${locale.toLowerCase()}`;
  return (
    <section dir={direction} className="rounded border border-line border-t-2 border-t-gold-300 bg-surface p-5">
      <label className="flex flex-col gap-3 text-sm font-semibold text-ink" htmlFor={id}>
        {locale} Tagline
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 border-b border-line-soft bg-transparent px-1 py-2 text-base leading-7 text-ink outline-none focus:border-b-2 focus:border-gold"
          maxLength={240}
        />
      </label>
      <p className="mt-2 text-sm text-ink-700">{t("Keep it concise: one sentence that introduces Hamid in this Locale.")}</p>
    </section>
  );
}

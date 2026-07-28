"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeSlugInput } from "@/lib/content/slug";
import { PublishRequirements } from "./publish-requirements";
import { DeleteContentButton } from "./delete-content-button";
import { usePortalLocale } from "./portal-locale-provider";

export type Article = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title_ar?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  body_ar?: string | null;
  body_fr?: string | null;
  body_en?: string | null;
  published_in_url?: string | null;
  published_in_name_ar?: string | null;
  published_in_name_fr?: string | null;
  published_in_name_en?: string | null;
  published_date?: string | null;
};

type ArticleFields = {
  slug: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  body_ar: string;
  body_fr: string;
  body_en: string;
  published_in_url: string;
  published_in_name_ar: string;
  published_in_name_fr: string;
  published_in_name_en: string;
  published_date: string;
};

const EMPTY_FIELDS: ArticleFields = {
  slug: "",
  title_ar: "",
  title_fr: "",
  title_en: "",
  body_ar: "",
  body_fr: "",
  body_en: "",
  published_in_url: "",
  published_in_name_ar: "",
  published_in_name_fr: "",
  published_in_name_en: "",
  published_date: "",
};

function fieldsFrom(article?: Article): ArticleFields {
  if (!article) return EMPTY_FIELDS;

  return {
    slug: article.slug,
    title_ar: article.title_ar ?? "",
    title_fr: article.title_fr ?? "",
    title_en: article.title_en ?? "",
    body_ar: article.body_ar ?? "",
    body_fr: article.body_fr ?? "",
    body_en: article.body_en ?? "",
    published_in_url: article.published_in_url ?? "",
    published_in_name_ar: article.published_in_name_ar ?? "",
    published_in_name_fr: article.published_in_name_fr ?? "",
    published_in_name_en: article.published_in_name_en ?? "",
    published_date: article.published_date ?? "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isCompleteAcrossLocales(ar: string, fr: string, en: string) {
  return isFilled(ar) === isFilled(fr) && isFilled(fr) === isFilled(en);
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const { locale, t } = usePortalLocale();
  const [fields, setFields] = useState(() => fieldsFrom(article));
  const [status, setStatus] = useState(article?.status ?? "draft");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const isPublished = status === "published";
  const hasInstitutionalTitle = /\bstatement\b|\bcommuniqu(?:e|[\u00e9\u00c9])(?=\s|$|[.,:;!?])/i.test(
    `${fields.title_ar} ${fields.title_fr} ${fields.title_en}`,
  );
  const articleLocales = [[fields.title_ar, fields.body_ar], [fields.title_fr, fields.body_fr], [fields.title_en, fields.body_en]];
  const hasCompleteLocale = articleLocales.some(([title, body]) => isFilled(title) && isFilled(body));
  const hasPartialLocale = articleLocales.some(([title, body]) => isFilled(title) !== isFilled(body));
  const canPublish = Boolean(article?.id) && hasCompleteLocale && !hasPartialLocale && isFilled(fields.published_date);
  const publishRequirements = isPublished ? [] : [
    !article ? "Save this draft before publishing." : "",
    !hasCompleteLocale ? "A title and body in Arabic, French, or English" : "",
    hasPartialLocale ? "Complete the title and body for each language you start" : "",
    !isFilled(fields.published_date) ? "Original publication date" : "",
    !isCompleteAcrossLocales(fields.published_in_name_ar, fields.published_in_name_fr, fields.published_in_name_en) ? "Publication name in Arabic, French, and English — or leave all three blank" : "",
  ].filter(Boolean);

  function changeField(name: keyof ArticleFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save("save");
  }

  async function save(action: "save" | "publish") {
    setMessage("");
    if (!isFilled(fields.slug)) {
      setMessage("A URL slug is required to save this Article.");
      return;
    }

    if (action === "publish") setPublishing(true);
    else setSaving(true);

    try {
      const response = await fetch("/api/portal/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: article?.id,
          ...fields,
          action,
        }),
      });
      const result = await response.json() as {
        error?: string;
        article?: Pick<Article, "id" | "slug" | "status">;
      };
      if (!response.ok || !result.article) throw new Error(result.error ?? "The Article could not be saved.");

      setStatus(result.article.status);
      if (!article) {
        router.replace(`/portal/articles/${result.article.slug}`);
        return;
      }

      setMessage(action === "publish" ? "Published. The Profile will update after its deployment completes." : "Saved.");
      router.refresh();
    } catch (error) {
      setMessage(messageFor(error, "The Article could not be saved."));
    } finally {
      if (action === "publish") setPublishing(false);
      else setSaving(false);
    }
  }

  async function shareArticle() {
    if (!isPublished || !fields.slug) return;

    try {
      const url = new URL(`/${locale}/articles/${fields.slug}`, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setShareMessage(t("Article link copied. You can now paste it into social media."));
    } catch {
      setShareMessage(t("We could not copy the article link. Please copy it from the browser address bar."));
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      {isPublished ? (
        <p className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">
          This Article is public. Save changes to update the published version.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor="article-slug">
          {t("URL slug")}
          <input
            id="article-slug"
            value={fields.slug}
            onChange={(event) => changeField("slug", normalizeSlugInput(event.target.value))}
            className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <p className="text-sm text-zinc-600">{t("Status:")} {t(status)}</p>
      </div>

      <p className="rounded border border-zinc-300 bg-white p-4 text-sm text-zinc-700">
        What kind of piece is this? Op-ed, essay, policy brief, published article.
      </p>
      {hasInstitutionalTitle ? (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Site-original content only — institutional statements belong on the institution&apos;s website. See ADR-0002.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <LocalePane
          locale="Arabic"
          direction="rtl"
          title={fields.title_ar}
          body={fields.body_ar}
          publicationName={fields.published_in_name_ar}
          onTitleChange={(value) => changeField("title_ar", value)}
          onBodyChange={(value) => changeField("body_ar", value)}
          onPublicationNameChange={(value) => changeField("published_in_name_ar", value)}
        />
        <LocalePane
          locale="French"
          direction="ltr"
          title={fields.title_fr}
          body={fields.body_fr}
          publicationName={fields.published_in_name_fr}
          onTitleChange={(value) => changeField("title_fr", value)}
          onBodyChange={(value) => changeField("body_fr", value)}
          onPublicationNameChange={(value) => changeField("published_in_name_fr", value)}
        />
        <LocalePane
          locale="English"
          direction="ltr"
          title={fields.title_en}
          body={fields.body_en}
          publicationName={fields.published_in_name_en}
          onTitleChange={(value) => changeField("title_en", value)}
          onBodyChange={(value) => changeField("body_en", value)}
          onPublicationNameChange={(value) => changeField("published_in_name_en", value)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
        <legend className="px-1 text-base font-semibold text-zinc-950">Original publication details</legend>
        <TextField label="Original publication date" id="article-published-date" type="date" value={fields.published_date} onChange={(value) => changeField("published_date", value)} />
        <TextField label="Original publication URL" id="article-published-in-url" type="url" optional value={fields.published_in_url} onChange={(value) => changeField("published_in_url", value)} />
        <p className="text-sm text-zinc-600">If the piece first appeared elsewhere, provide both publication names. The URL is optional.</p>
      </fieldset>

      {message ? <p role="alert" className="rounded bg-zinc-100 p-3 text-sm text-zinc-800">{message}</p> : null}
      <PublishRequirements requirements={publishRequirements} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || publishing} className="rounded bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? t("Saving...") : isPublished ? t("Save changes") : t("Save as draft")}
        </button>
        {!isPublished ? (
          <button type="button" disabled={!canPublish || saving || publishing} onClick={() => void save("publish")} className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60">
            {publishing ? t("Publishing...") : t("Publish")}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!isPublished || saving || publishing}
          onClick={() => void shareArticle()}
          className="rounded border border-zinc-950 px-4 py-2 font-semibold text-zinc-950 transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("Copy article link")}
        </button>
      </div>
      {article ? <DeleteContentButton itemType="article" id={article.id} returnTo="/portal/articles" /> : null}
      {shareMessage ? <p role="status" className="text-sm text-zinc-700">{shareMessage}</p> : null}
      {!article ? <p className="text-sm text-zinc-600">Save the draft before publishing it.</p> : null}
    </form>
  );
}

function LocalePane({
  locale,
  direction,
  title,
  body,
  publicationName,
  onTitleChange,
  onBodyChange,
  onPublicationNameChange,
}: {
  locale: "Arabic" | "French" | "English";
  direction: "rtl" | "ltr";
  title: string;
  body: string;
  publicationName: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onPublicationNameChange: (value: string) => void;
}) {
  const suffix = locale.toLowerCase();
  return (
    <section dir={direction} className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-950">{locale}</h2>
      <TextField label={`${locale} title`} id={`article-title-${suffix}`} value={title} onChange={onTitleChange} />
      <ArticleBodyEditor locale={locale} direction={direction} value={body} onChange={onBodyChange} />
      <TextField label={`${locale} publication name`} id={`article-published-in-name-${suffix}`} optional value={publicationName} onChange={onPublicationNameChange} />
    </section>
  );
}

function ArticleBodyEditor({
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
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-44 rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-500",
        dir: direction,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-800">{locale} body</p>
      <div className="flex flex-wrap gap-2" aria-label={`${locale} formatting tools`}>
        <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
        <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="Heading" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton label="Bullets" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
      </div>
      <EditorContent editor={editor} aria-label={`${locale} body editor`} />
      <p className="text-sm text-zinc-600">Formatting is cleaned on the server when you save.</p>
    </div>
  );
}

function ToolbarButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="rounded border border-zinc-400 px-2 py-1 text-sm font-medium text-zinc-950">
      {label}
    </button>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  optional = false,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  type?: "text" | "url" | "date";
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800" htmlFor={id}>
      {label}{optional ? " (optional)" : ""}
      <input
        id={id}
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-950"
      />
    </label>
  );
}

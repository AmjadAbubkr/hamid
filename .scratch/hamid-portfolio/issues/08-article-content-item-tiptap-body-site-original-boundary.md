# 08 — Article Content Item (Tiptap body, site-original boundary)

**What to build:** The fifth Content Item end-to-end slice. Article is the first Content Item with a long-form rich-text body — Tiptap editor in the Portal, paired ar/fr panes (RTL handled inside Tiptap, not just at the document root). The Portal form has paired ar/fr panes for `title_ar`+`title_fr` and `body_ar`+`body_fr` (Tiptap-managed HTML, sanitized server-side), plus type-specific fields `published_in_url` (optional external source URL when the article first appeared in press), `published_in_name_ar`+`published_in_name_fr`, `published_date` (the original publication date, distinct from the site's `published_at`).

The Profile renders an `/articles` listing (descending by `published_date`, not by site publish time — journalist-friendly) and an `/articles/[slug]` detail page rendering the rich HTML body with monospace canonical footer below it.

ADR-0002 boundary enforcement: the Portal form's helper copy ("What kind of piece is this? Op-ed, essay, policy brief, published article.") explicitly steers the Editor toward site-original content. A "Statement" or "Communiqué" type is NOT offered as a category. If the Editor's title field looks like a ministry communiqué (loose heuristic — TBD by implementation, may be skipped initially and revisited in ticket 11), a soft inline reminder appears: "Site-original content only — institutional statements belong on the institution's website. See ADR-0002." This is a UX guardrail, not a hard block.

**Blocked by:** 04 — Position Held: first Content Item end-to-end (Tiptap setup is new here but the Portal form pattern is from 04)

**Status:** ready-for-agent

- [ ] `article` table via Supabase migration following ticket 02's pattern; type-specific fields `body_ar`+`body_fr` (TEXT — sanitized HTML), `published_in_url` (nullable URL), `published_in_name_ar`+`published_in_name_fr`, `published_date`
- [ ] `/portal/articles` Portal form integrates Tiptap rich-text editor in BOTH paired ar/fr Body panes; the Editor UI works correctly in RTL when editing the Arabic body
- [ ] Server-side HTML sanitizer (allowlist-based, e.g. `rehype-sanitize` or DOMPurify) runs on every Body write; script tags, iframes, and event handlers are stripped
- [ ] `/articles` listing renders published Articles descending by `published_date`; bilingual via RTL/LTR auto-direction
- [ ] `/articles/[slug]` renders the rich HTML body with sensible typography and the canonical-URL footer
- [ ] The Portal form's helper copy and field labels intentionally avoid offering a "Statement" / "Communiqué" category, per ADR-0002
- [ ] Draft items return 404; preview is authenticated-only

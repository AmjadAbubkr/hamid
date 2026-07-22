# 04 — Position Held: first Content Item end-to-end

**What to build:** The first complete vertical slice of a Content Item — Portal CRUD + Profile rendering + bilingual publish gate + canonical footer + Draft-404 behavior. This ticket proves the full stack once, end to end, for one Content Item type; tickets 05–09 then repeat the pattern for the other five Content Item types.

Portal: an authenticated Editor at `/portal/positions` sees a list of existing Position Held items (Title, institution, dates, status). "New" opens a form with paired ar/fr panes (left: Arabic fields, right: French fields) for `title_ar`+`title_fr`, `body_ar`+`body_fr` (rich text or plain depending on what ticket 02 left us with — TBD by Editor UX during implementation), plus type-specific fields `institution`, `start_date`, `end_date` (nullable, "present" if null), `location`. "Save as draft" persists without the gate; "Publish" is disabled until both Locales' required fields are filled (UX gate), and on click calls the server's `publish_content_item()` function from ticket 02 (database gate). Errors surface in plain language to the Editor.

Profile: the `/career` route reads published Position Held rows ordered by `start_date DESC` and renders a bilingual timeline. With `<html dir="auto">`, the same component renders RTL for Arabic and LTR for French using only Tailwind logical-property utilities. Each item links to `/career/[slug]`.

Absence behavior per ADR-0009 §1: a request to `/career/[slug]` for a slug that is Draft (or missing) returns HTTP 404 — no "translation pending" placeholder, no "draft coming soon". A logged-in Editor can preview their own Draft at `/portal/positions/[slug]/preview` (no-cache headers,_authenticated only).

Canonical footer per ADR-0009 §3: every public page renders the full canonical URL of itself in a `<footer>` element, monospace, stable HTML across Locales, so a screenshot can be cross-checked against the URL.

Deploy: on publish, a Supabase DB trigger calls a Netlify build hook so the static Profile rebuilds within a minute of the Editor hitting Publish.

**Blocked by:** 02 — Content Item data model + bilingual paired-column schema; 03 — Passkey auth + one-time numeric recovery code

**Status:** ready-for-agent

- [ ] `/portal/positions` route renders a list of existing Position Held items for the authenticated Editor; unauthenticated users redirect to `/portal/login`
- [ ] New Position Held form saves as Draft (one or both Locales empty allowed) without triggering the bilingual gate
- [ ] The Publish button is client-side disabled until both Locales' required fields are non-empty AND server-side the `publish_content_item()` function enforces the same gate atomically
- [ ] On publish: a Supabase DB trigger fires a Netlify build hook, the static Profile rebuilds, and the new item appears on `/career` within ~1 minute
- [ ] `/career` renders the bilingual timeline using Tailwind logical-property utilities; toggling between `/ar` and `/fr` routes flips `dir` without layout artifacts (no overflow, no mis-aligned bullets, no off-side icons)
- [ ] `/career/[slug]` returns HTTP 404 for Draft or missing slugs; a `curl -I` confirms `404 Not Found`
- [ ] `/portal/positions/[slug]/preview` shows the Editor the Draft version with `Cache-Control: no-store`, reachable only when authenticated; unauthenticated redirect to `/portal/login`
- [ ] Every public page renders the canonical fully-qualified URL in a `<footer>` element in monospace; a screenshot of any page contains its own URL visible at the bottom

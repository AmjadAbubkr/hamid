# 04 — Position Held: first Content Item end-to-end

**What to build:** The first complete vertical slice of a Content Item — Portal CRUD + Profile rendering + bilingual publish gate + canonical footer + Draft-404 behavior. This ticket proves the full stack once, end to end, for one Content Item type; tickets 05–09 then repeat the pattern for the other five Content Item types.

Portal: an authenticated Editor at `/portal/positions` sees a list of existing Position Held items (Title, institution, dates, status). "New" opens a form with paired ar/fr panes (left: Arabic fields, right: French fields) for `title_ar`+`title_fr`, `body_ar`+`body_fr` (rich text or plain depending on what ticket 02 left us with — TBD by Editor UX during implementation), plus type-specific fields `institution`, `start_date`, `end_date` (nullable, "present" if null), `location`. "Save as draft" persists without the gate; "Publish" is disabled until both Locales' required fields are filled (UX gate), and on click calls the server's `publish_content_item()` function from ticket 02 (database gate). Errors surface in plain language to the Editor.

Profile: the `/career` route reads published Position Held rows ordered by `start_date DESC` and renders a bilingual timeline. With `<html dir="auto">`, the same component renders RTL for Arabic and LTR for French using only Tailwind logical-property utilities. Each item links to `/career/[slug]`.

Absence behavior per ADR-0009 §1: a request to `/career/[slug]` for a slug that is Draft (or missing) returns HTTP 404 — no "translation pending" placeholder, no "draft coming soon". A logged-in Editor can preview their own Draft at `/portal/positions/[slug]/preview` (no-cache headers,_authenticated only).

Canonical footer per ADR-0009 §3: every public page renders the full canonical URL of itself in a `<footer>` element, monospace, stable HTML across Locales, so a screenshot can be cross-checked against the URL.

Deploy: on publish, a Supabase DB trigger calls a Netlify build hook so the static Profile rebuilds within a minute of the Editor hitting Publish.

## Initial dataset — current Position Held (to seed the first published row when the Portal is ready)

Real-world data confirmed by user on 2026-07-22, sourced from Decree n° 1005/PR/PM/MC/2026 of 22 May 2026 (Republic of Chad, Ministry of Communication):

- `title_ar`: مفتش تقني
- `title_fr`: Inspecteur technique
- `institution` (likely bilingual or stored once with consistent spelling): Ministère de la Communication (Tchad)
- `start_date`: 2026-05-22 (decree date)
- `end_date`: null  (position currently held — "present")
- `location`: N'Djamena, Tchad
- `body_ar` (suggested short paragraph for the Profile detail page, editor will refine): صدر بالمرسوم رقم 1005/PR/PM/MC/2026 المؤرخ في 22 مايو 2026.
- `body_fr` (suggested): Nommé par le décret n° 1005/PR/PM/MC/2026 du 22 mai 2026.
- `slug`: inspecteur-technique-ministere-communication-2026

## Source CV

The Subject's full CV is at `D:\hamid\CV AZAZ SANS SIGNATURE 2025.pdf` (added to the codebase by the user on 2026-07-22). This is the primary source for prior Positions Held, Education Entries, and Past Participations that tickets 05–09 will model. The PDF cannot be read inline by current tooling — its content must be transcribed by the Editor via the Portal once each ticket's form is implemented, OR extracted once and pasted into the relevant tickets' "Initial dataset" sections by an operator with PDF access.

NEITHER the CV PDF nor any of its content should be auto-seeded into the database automatically — the Editor must enter it via the Portal so the bilingual gate and per-Locale fields are honoured. The CV is included in the repo only as a reference artifact; check it into git alongside the rest of the working tree (it contains no secrets).

These are inputs the Editor will enter manually via the Portal once ticket 04 ships; this ticket does not script seed them into the database automatically — that remains a Portal UX action so the Editor sees the form end-to-end. The values above are recorded here so they aren't lost across context windows.

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

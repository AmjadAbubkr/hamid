# 02 — Content Item data model + bilingual paired-column schema

**What to build:** The Supabase migration that establishes the **shared data model pattern every Content Item type will follow**, dictated by ADR-0003 (synced bilingual, paired columns) and ADR-0009 §1 (Draft returns 404). This ticket does NOT create any specific Content Item table (Position Held, Article, etc.) — it establishes the *pattern* one time so tickets 04–09 each add one table on the same pattern without revisiting the schema decision.

Concrete shape: a `content_items` parent table (or an enforced naming convention) holding the columns every Content Item shares — `id`, `slug` (unique per item type), `status` enum (`draft`/`published`), `created_at`, `updated_at`, `published_at`, `author_editor_id` (FK to the editor identity, created minimally here even though full editor modeling lands in ticket 03). A representative child table `position_held` is created in this ticket to prove the pattern (per-Locale paired fields `title_ar`+`title_fr`, `body_ar`+`body_fr`, plus type-specific fields like `institution`, `start_date`, `end_date`, `location`).

Row-Level Security policies:
- Public (`anon`) can SELECT only rows where `status = 'published'`
- Only the authenticated Editor can INSERT/UPDATE/DELETE

A Postgres function `publish_content_item(item_id)` enforces the bilingual gate: it raises an exception if either `*_ar` or `*_fr` required field is empty, otherwise flips `status` to `published` and stamps `published_at`. Editors cannot bypass this by direct UPDATE — a trigger re-validates on any UPDATE that sets `status = 'published'`.

**Blocked by:** 01 — Project skeleton: Next.js + Tailwind + Supabase on Netlify

**Status:** ready-for-agent

- [ ] Supabase migration file creates `content_items` parent (or documents the enforced pattern) plus a `position_held` child table as the pattern exemplar, with paired `title_ar`+`title_fr` and `body_ar`+`body_fr` columns
- [ ] A `status` enum (`draft`, `published`) is defined; `published_at` is null while draft, set when published
- [ ] RLS policy: unauthenticated SELECT returns only `status = 'published'` rows; INSERT/UPDATE/DELETE require the authenticated Editor role
- [ ] A Postgres `publish_content_item()` function atomically sets `status = 'published'` and `published_at = now()` only when both Locales' required fields are non-empty; raises a clear exception otherwise
- [ ] A trigger on `position_held` (and any future Content Item table) rejects direct UPDATEs that flip `status` to `published` without going through the gate function — i.e. the gate cannot be bypassed
- [ ] Draft rows for a given slug return no rows via the anon key (verifiable with a Supabase query)

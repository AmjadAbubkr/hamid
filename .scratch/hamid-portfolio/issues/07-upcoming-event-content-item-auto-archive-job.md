# 07 — Upcoming Event Content Item + auto-archive job

**What to build:** The fourth Content Item end-to-end slice, plus the auto-archive behavior that distinguishes Upcoming Event from Past Participation per ADR-0001 and ADR-0009 §2. The Portal form has paired ar/fr panes plus type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`institution_fr`, `role` enum (same set as Past Participation), optional `registration_url`.

The Profile renders Upcoming Events on a dedicated `/events` page (events descending by date) AND as a card on the homepage (`/`). The homepage card shows only the next 1–3 upcoming events — implementation picks a sensible default and notes it.

Auto-archive: a Supabase scheduled function (pg_cron or a Netlify scheduled Function, decided during implementation) runs daily. It selects all `upcoming_event` rows where `event_date < CURRENT_DATE`, creates equivalent `past_participation` rows (role field preserved; new entry's body may equal the upcoming event's announcement body — implementation decides), and deletes the original `upcoming_event` row in a single transaction. The Editor is NOT required to manually archive; ping-ponging an event between the two tables is not a feature.

**Blocked by:** 04 — Position Held: first Content Item end-to-end, 06 — Past Participation Content Item (the auto-archive migrates into Past Participation's table)

**Status:** ready-for-agent

- [ ] `upcoming_event` table via Supabase migration following ticket 02's pattern; type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`institution_fr`, `role` enum, optional `registration_url`
- [ ] `/portal/events` route mirrors `/portal/positions` UX with publish-gate and preview
- [ ] `/events` Profile route renders Upcoming Events descending by `event_date`, bilingual via RTL/LTR auto-direction
- [ ] Homepage renders the next 1–3 Upcoming Events as a card; absence of Upcoming Events (none scheduled) renders the section empty without layout breakage
- [ ] A scheduled job (pg_cron or Netlify Scheduled Function) runs at least daily and migrates rows with `event_date < CURRENT_DATE` into `past_participation` atomically — verified by inserting a fake past-dated Upcoming Event and confirming it appears in Past Participation within one job run
- [ ] An Upcoming Event archived to Past Participation preserves all bilingual fields and the `role` enum
- [ ] Draft items return 404; preview is authenticated-only

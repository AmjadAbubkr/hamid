# 06 — Past Participation Content Item

**What to build:** The third Content Item end-to-end slice reusing the pattern from ticket 04. Past Participation is a historical event Hamid attended as Speaker, Panelist, Host, or Delegate (ADR-0001 — explicitly distinct from Upcoming Event, which lands in ticket 07). The Portal form has paired ar/fr panes for the event title, body, plus type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`venue_fr`, `role` enum (Speaker/Panelist/Host/Delegate), optional `source_url`.

The Profile renders Past Participation on `/career` as a third grouped section, with the most recent participation at the top. A separate read path `/participations/[slug]` is also exposed so a press officer can deep-link to a single historical appearance. The auto-archive job that *converts* Upcoming Events into Past Participation once their date passes is implemented in ticket 07, NOT here — this ticket only creates the Past Participation Content Item table and UX.

**Blocked by:** 04 — Position Held: first Content Item end-to-end

**Status:** ready-for-agent

- [ ] `past_participation` table via Supabase migration following ticket 02's pattern; type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`institution_fr`, `role` enum
- [ ] `/portal/participations` route mirrors `/portal/positions` UX with the same publish-gate and preview behavior
- [ ] `/career` page renders Past Participation as a third grouped section beneath Education Entries
- [ ] `/participations/[slug]` deep-link route exposes single Past Participation items per ADR-0001 (so press can link to one appearance directly)
- [ ] Draft items return 404; preview is authenticated-only
- [ ] The migration's DOWN path cleanly drops the table without affecting Position Held or Education Entry tables

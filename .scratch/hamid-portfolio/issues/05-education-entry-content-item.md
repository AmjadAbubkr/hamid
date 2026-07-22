# 05 — Education Entry Content Item

**What to build:** The second Content Item end-to-end slice, reusing the pattern proven by ticket 04. Education Entry is a career-timeline row representing a degree, diploma, or formal programme Hamid completed (see CONTEXT.md). The Portal form has paired ar/fr panes plus type-specific fields `degree_ar`+`degree_fr`, `institution`, `start_date`, `end_date`, `location`, optional `honours_ar`+`honours_fr`. The Profile renders Education rows on the same `/career` page as Positions Held, grouped under their own subheading.

This ticket's smallest deliverable is "verify the abstraction holds": if ticket 04 established the pattern cleanly, this ticket should be mostly COPY-ADAPT; if surprises emerge (a field type or list rendering gap), they're surfaced here and ticket 04's pattern gets refactored.

**Blocked by:** 04 — Position Held: first Content Item end-to-end

**Status:** ready-for-agent

- [ ] `education_entry` table created via Supabase migration following the pattern from ticket 02 (paired `*_ar`+`*_fr`, status enum, FK to editor, RLS policies)
- [ ] `/portal/education` route mirrors `/portal/positions` UX: list, new, edit, publish-gated, preview
- [ ] `/career` page renders Education Entries under a distinct subheading below Positions Held, with the same bilingual timeline treatment
- [ ] Draft Education Entry items return 404 on their slug URL; preview works authenticated only
- [ ] The Supabase→Netlify build hook fires on Education Entry publish (no separate wiring needed if ticket 04 hooked on `content_items` generally)

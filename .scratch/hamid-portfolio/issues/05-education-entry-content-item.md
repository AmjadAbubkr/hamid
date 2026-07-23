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

## Initial dataset — Education Entries confirmed from CV (13 Sept 2025)

Sourced from `D:\hamid\CV AZAZ SANS SIGNATURE 2025.pdf`. The Editor will enter these via the Portal once ticket 05 ships; not auto-seeded.

1. Master 2 en Droit Public — Droit International et Communautaire
   - `institution`: Université de Yaoundé II/SOA
   - `start_date`: 2018, `end_date`: 2019
   - `location`: Yaoundé, Cameroun
   - `slug`: m2-droit-public-yaounde-ii-2019

2. Licence en Droit Public
   - `institution`: Université de Yaoundé II/SOA
   - `start_date`: 2017, `end_date`: 2018
   - `location`: Yaoundé, Cameroun
   - `slug`: licence-droit-public-yaounde-ii-2018

3. Baccalauréat A4 (série littéraire)
   - `institution`: Lycée Moderne de Bongor
   - `start_date`: 2012, `end_date`: 2013
   - `location`: Bongor, Tchad
   - `slug`: bac-a4-lycee-bongor-2013

Arabic translations for `degree_ar` and `institution_ar` (where applicable — e.g., Université de Yaoundé II may stay in Latin script per common Chadian academic conventions) will be drafted by the Editor. The bilingual publish gate from ticket 02 requires either `degree_ar`+`degree_fr` or paired `institution_*` fields non-empty — implementation should clarify which fields are required-paired.

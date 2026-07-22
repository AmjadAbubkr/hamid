# Two-Locale Ceiling — No English

The site supports exactly two Locales: Arabic (`ar`, RTL) and French (`fr`, LTR). A third Locale — most plausibly English (`en`) for international press — is explicitly **not** a future roadmap item; the sponsor has decided the diplomatic and international audience the site serves is adequately served by French alone.

## Decision

Content Item tables carry named paired columns (`title_ar`+`title_fr`, `body_ar`+`body_fr`, etc.). No JSONB contents structure is used to soft-support a future third Locale. The Portal editor form renders exactly two Locale panes.

## Considered Options

- Deferred — JSONB Contents blob per Content Item so `en` could be added later as a data migration. Rejected: complexity today for a tomorrow that the sponsor has decided not to want.
- Built now — ship all three Locales. Rejected: extra bilingual burden on every Content Item without an audience justification.

## Consequences

- The Locale typing is a closed set at every layer (data model, Portal, Profile, routing). Adding a third Locale later is now a project-sized schema migration: every Content Item table gains paired `*_en` columns, every existing row carries a null English value, and a backfill-policy decision must be made for historical Content Items.
- A future deletion of a Locale is approximately symmetric in cost.
- A future engineer who wants to "just add English" must read this ADR, weigh the project-sized migration, and consciously supersede it; this ADR exists to stop the casual add.

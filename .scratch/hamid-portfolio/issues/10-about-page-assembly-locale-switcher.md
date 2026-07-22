# 10 — About page assembly + locale switcher

**What to build:** The `/about` route, auto-assembled from a Tagline (per-Locale one-liner) + current Position Held + full Positions Held timeline + Education list + Past Participation summary. The Tagline is a small standalone Content Item (`tagline` table — single-row, paired `tagline_ar`+`tagline_fr`, edited via its own `/portal/tagline` form). There is NO free-text Bio Content Item (confirmed in grilling); the page is fully assembled from structured Content Items.

This ticket also delivers the locale switcher: a URL-driven control that lets a Visitor flip between `/ar/...` and `/fr/...` while preserving the current path. No JS cookies — the locale encoding lives entirely in the URL, so search engines index each Locale's URL separately and visitors can deep-link a Locale-specific URL. The selected Locale persists in the URL across navigation.

The assembled About page renders in RTL or LTR per the URL's Locale, using only Tailwind logical-property utilities per ADR-0008. The canonical-URL footer reflects the About page's own URL.

**Blocked by:** 04 — Position Held: first Content Item end-to-end, 05 — Education Entry Content Item, 06 — Past Participation Content Item

**Status:** ready-for-agent

- [ ] `tagline` table via Supabase migration following ticket 02's pattern but constrained to a single row (enforced by a partial unique index or a singleton-table pattern); fields `tagline_ar`+`tagline_fr`
- [ ] `/portal/tagline` is a single-form Portal route for editing the one Tagline row (no list, no delete, no "New" — there is always exactly one Tagline)
- [ ] `/about` Profile route auto-assembles the page from Tagline + current Position Held (max `end_date IS NULL`, ordered by `start_date DESC`) + full Positions Held timeline + Education list + Past Participation summary; no free-text Bio prose appears
- [ ] A locale switcher control renders on every public page; clicking it flips the current URL between `/ar/...` and `/fr/...` while preserving the path; the active Locale is visually highlighted
- [ ] Setting the Tagline to empty in one Locale leaves the page renderable in the other Locale, but the publish-gate (from ticket 02, applied to the singleton Tagline row) blocks publishing until both Locales' taglines are filled
- [ ] The canonical-URL footer on `/about` renders the About page's own canonical URL, not the home page's
- [ ] Search-engine discoverability: `<link rel="alternate" hreflang="ar" href="...">` and `<link rel="alternate" hreflang="fr" href="...">` tags render with the correct per-Locale URLs

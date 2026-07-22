# 11 — Hardening and .com deploy

**What to build:** The "ship it" gate. Final absence-behavior regression across every Content Item type, RLS audit end-to-end, recovery-code-rotation dry-run, production DNS configured for the chosen `.com` per ADR-0006, sitemap.xml and robots.txt generated per Locale, and a final SEO sanity check.

This ticket does NOT add features. It is a vertical slice in the sense that the deliverable is "a production-ready website at the real `.com` domain". All earlier tickets can deploy to Netlify preview URLs; this ticket is the production cutover.

Regression suite: a single integration test run verifies that every Draft Content Item URL across all six Content Item types returns 404 / unreachable image URLs, every Published Content Item URL returns 200, and the canonical-URL footer renders correctly on every public page across both Locales.

RLS audit: a manual run with the anon key attempting INSERT/UPDATE/DELETE on every Content Item table confirms denial. A run with the Editor session confirms success (where authorized). Documented in the ticket's README so future regression runs can repeat it.

Recovery code dry-run: an Editor simulates losing all passkeys, runs through `/portal/recover` with their stored recovery code, confirms the recovery code is invalidated after the attempt (success or failure), and successfully enrolls a new passkey. A new recovery code is issued on the new enrollment.

`.com` deployment: the chosen `.com` domain is added to Netlify DNS; Apex and `www` both redirect to the canonical host (decided during implementation — Apex is simpler); HTTPS via Netlify's managed certificate is up; sitemap.xml is submitted to Google Search Console (manual step — editor/dev does this once).

**Blocked by:** 04 — Position Held, 05 — Education Entry, 06 — Past Participation, 07 — Upcoming Event + auto-archive job, 08 — Article, 09 — Gallery Photo, 10 — About page + locale switcher

**Status:** ready-for-agent

- [ ] Integration test suite covers Draft-404 behavior for every Content Item type (Position Held, Education Entry, Past Participation, Upcoming Event, Article, Gallery Photo, Tagline); one test per type
- [ ] Integration test suite verifies canonical-URL footer presence on at least one URL per public route type (`/`, `/about`, `/career`, `/career/[slug]`, `/events`, `/articles`, `/articles/[slug]`, `/gallery`, `/participations/[slug]`)
- [ ] RLS audit documented: anon INSERT/UPDATE/DELETE is denied on every Content Item table; Editor session is allowed (where the row belongs to the Editor — i.e. all rows since the single-Editor model is in force)
- [ ] Recovery code dry-run documented: the code is invalidated after use, re-enrollment succeeds, a NEW recovery code is issued at re-enrollment, and the old code cannot be reused
- [ ] The `.com` domain is added to Netlify DNS; apex and `www` both serve the site (one canonical, the other a redirect — implementation chooses)
- [ ] HTTPS via Netlify-managed certificate is live and serving; HSTS header is enabled
- [ ] `sitemap.xml` and `robots.txt` are generated per Locale and reachable at `/sitemap.xml` (single sitemap referencing Locale-prefixed paths is acceptable)
- [ ] Per-Content-Item listing on the homepage and section pages is empty-state-tolerant: a Profile site with zero Articles still renders `/articles` with a "no articles yet" message rather than a 500 or a missing-section layout break

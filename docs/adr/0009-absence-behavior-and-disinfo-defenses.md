# Absence Behavior: 404s, Auto-Archive, Canonical Footer

Three system-level behaviors that protect both the Subject's credibility and the Visitor's trust, specified once here so they don't regress and so a future engineer doesn't "fix" them.

## 1. Draft Content Item URLs Return 404

A Content Item in the Draft state, or whose paired Locale fields are incomplete, returns a real HTTP 404 to any Visitor request at its URL. We deliberately do not show "translation pending" or "draft coming soon" placeholders because:
- Showing a placeholder reveals the existence and URL of unpublished content to the public and to crawlers (leak risk for a political figure).
- Placeholders invite opponents to scrape upcoming URLs looking for unpublished statements.

An Editor logged into the Portal can preview their own Draft via an authenticated preview route that requires the Editor session; this route is not discoverable, returns no-cache headers, and never sets an HTTP 200 GET cacheable state.

## 2. Upcoming Events Auto-Archive as Past Participation

The day after an Upcoming Event's scheduled date, a scheduled server-side job moves the row from the Upcoming Event table to the Past Participation table. The row is preserved (recurrence, institution, venue, date fields) and gains the role field default of "Speaker" (modifiable by Editor). The Editor does not need to manually archive; the homepage's upcoming feed is therefore guaranteed never to display a past-dated card.

## 3. Page Footer Carries Canonical URL

Every public page renders the canonical, fully-qualified URL of that page in its footer, in monospace, in a `<footer>` element with stable HTML across Locales so a screenshot can be cross-checked against the URL bar of the claimed site. This is a low-cost defense against doctored-screenshot disinformation, common in political arenas: a press officer who sees a screenshot claiming to be from Hamid's site can verify the URL against the visible footer.

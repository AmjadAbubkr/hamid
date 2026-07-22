# Hamid — Personal Public Profile

A bilingual (Arabic / French) public-facing website serving as the official online presence of Hamid, a Chadian diplomat and politician. The site functions as a personal public profile: positions held, education, past and upcoming participations, op-eds and essays, plus a gallery. It also exposes a private administration portal through which Hamid (and only Hamid) updates his own content without programmer intervention.

## Language

**Subject**:
The person the site is about — Hamid. The single individual whose career, positions, and public statements the site documents.
_Avoid_: User, account, profile-owner, customer. "User" is reserved for the editing portal's authenticated actor (see Editor).

**Editor**:
The authenticated actor who logs into the admin Portal to update the Subject's content. By design the only Editor is the Subject himself; the role is distinct from the Subject because future delegation scenarios (a chief of staff, a press officer) must be modelled explicitly, not silently broadened.
_Avoid_: Admin, administrator, superuser, content manager.

**Visitor**:
Any anonymous person viewing the public-facing Profile site. Visitors are not authenticated and cannot edit anything.
_Avoid_: User, reader, viewer, audience. "Audience" is a planning concept (citizens, press, party, diplomats), not a runtime role; every Audience member is technically a Visitor.

**Profile (or Profile site)**:
The public, read-only, multilingual half of the website. Serves the mixed audience (citizens, journalists, party/insiders, diplomatic community). Indexed by search engines.
_Avoid_: Frontend, marketing site, landing page, publiccms frontend. The Profile IS the product; the Portal is auxiliary.

**Portal**:
The private, authenticated, content-management half of the website. Used only by the Editor to create, edit, and publish content that appears on the Profile.
_Avoid_: Dashboard, admin panel, backoffice, CMS. (It may be CMS-like in behaviour but "admin panel" undersells its security-critical role for a political figure.)

**Content Item**:
Any unit of editable material the Editor creates in the Portal and that the Profile renders. Concrete Content Item types in this project: Position Held, Education Entry, Past Participation, Upcoming Event, Article, Gallery Photo.
_Avoid_: Post, entry, record, resource, node. "Post" implies a blog; this is not a blog.

**Position Held**:
A structured Content Item representing a formal appointment — a job, post, or role Hamid has held. Fields: Title, Institution, Start date, End date (or "present"), Location, optional summary. Rendered as timeline entries in the Career section.
_Avoid_: Job, role, employment, career (career is the section, not the row).

**Tagline**:
The single short, per-Locale sentence that appears at the top of the auto-assembled About page and elsewhere on the Profile (e.g., hero section). Not a free-text Bio; just a one-liner the Editor maintains in the Portal.
_Avoid_: Tagline in the marketing sense, slogan, bio headline. There is no Bio.

**Education Entry**:
A structured Content Item representing a degree, diploma, or formal programme Hamid completed. Fields: Degree, Institution, Start, End, Location, optional honours.
_Avoid_: School, diploma (overloaded — diploma is the document, not the programme).

**Past Participation**:
A structured Content Item representing an event Hamid attended in the past as speaker, panellist, host, or delegate. Rendered in the Career section alongside Positions Held and Education. Always historical; never rendered on the homepage's upcoming feed.
_Avoid_: Event (ambiguous — see Upcoming Event), attendance, appearance.

**Upcoming Event**:
A structured Content Item representing a future public appearance — an address, conference talk, press briefing, or public ceremony Hamid will participate in. Auto-archived (typically deleted from the upcoming feed) once the date passes. Rendered on the homepage and a dedicated `/events` page.
_Avoid_: Event (ambiguous — see Past Participation), schedule, calendar item.

**Article**:
A Content Item representing a written piece authored by, or principally attributed to, Hamid: an op-ed, a statement, a policy brief, a published essay. May have originally appeared in press or be site-original.
_Avoid_: Post, blog post, statement (an Article MAY be a statement, but "Statement" is a category not a Content Item type).

**Gallery Photo**:
A Content Item representing a single image in the public gallery. Fields: Image, Caption (per Locale), Date, optional Source/Photographer credit, optional Category.
_Avoid_: Picture, media, asset.

**Locale**:
A language+direction+region combination the Profile renders in. Currently exactly two Locales: `ar` (Arabic, RTL) and `fr` (French, LTR). Every Content Item is a single row carrying paired per-Locale fields; publishing a Content Item requires both Locales complete (see Draft and Published). A future third Locale (e.g. `en`) requires paired new columns on every Content Item table plus a backfill decision for existing rows.
_Avoid_: Language (imprecise — does not encode direction or formatting), translation, i18n bundle.

**Draft**:
The state of a Content Item that has unsaved or incomplete Locale coverage, or that the Editor has not yet promoted. Drafts are invisible to Visitors. A bilingual Draft may have one Locale filled and the other empty without violating the synced-publish rule — that rule only applies at publication.
_Avoid_: Unpublished, hidden, pending.

**Published**:
The state of a Content Item that is visible to Visitors. A bilingual publish action is gated on both Locales holding the required fields: an Editor cannot publish a Content Item with empty French or empty Arabic title/body.
_Avoid_: Live (operational overlap with "live" production environment), approved, pushed.

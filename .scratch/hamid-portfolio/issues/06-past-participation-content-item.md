# 06 — Past Participation Content Item

**What to build:** The third Content Item end-to-end slice reusing the pattern from ticket 04. Past Participation is a historical event Hamid attended as Speaker, Panelist, Host, or Delegate (ADR-0001 — explicitly distinct from Upcoming Event, which lands in ticket 07). The Portal form has paired ar/fr panes for the event title, body, plus type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`institution_fr`, `role` enum (Speaker/Panelist/Host/Delegate/Other), optional `source_url`.

The Profile renders Past Participation on `/career` as a third grouped section, with the most recent participation at the top. A separate read path `/participations/[slug]` is also exposed so a press officer can deep-link to a single historical appearance. The auto-archive job that *converts* Upcoming Events into Past Participation once their date passes is implemented in ticket 07, NOT here — this ticket only creates the Past Participation Content Item table and UX.

**Blocked by:** 04 — Position Held: first Content Item end-to-end

**Status:** ready-for-agent

- [ ] `past_participation` table via Supabase migration following ticket 02's pattern; type-specific fields `event_date`, `venue_ar`+`venue_fr`, `institution_ar`+`institution_fr`, `role` enum
- [ ] `/portal/participations` route mirrors `/portal/positions` UX with the same publish-gate and preview behavior
- [ ] `/career` page renders Past Participation as a third grouped section beneath Education Entries
- [ ] `/participations/[slug]` deep-link route exposes single Past Participation items per ADR-0001 (so press can link to one appearance directly)
- [ ] Draft items return 404; preview is authenticated-only
- [ ] The migration's DOWN path cleanly drops the table without affecting Position Held or Education Entry tables

## Initial dataset — Past Participations confirmed from CV (13 Sept 2025)

Sourced from `D:\hamid\CV AZAZ SANS SIGNATURE 2025.pdf`. The Editor will enter these via the Portal once ticket 06 ships; not auto-seeded. Date ranges are recorded per the CV; some entries give year only, others give a full date range — Portal form must support both.

Note on the `role` enum: the CV uses roles beyond the original ticket 06 spec (`Speaker/Panelist/Host/Delegate`). Expanded canonical set (also used by ticket 07 for Upcoming Events): `Speaker`, `Panelist`, `Host`, `Delegate`, `Rapporteur`, `Facilitator`, `Coordinator`, `usher` (Huissier), `President`, `Representative`, `Ambassador`, `Trainer`, `Member`, `Participant`, `Other`. The Editor picks the closest canonical role; if none fits, `Other` with a free-text `role_other_ar`/`role_other_fr` field is the fallback. Per ADR-0001 these are immutable historical records.

### International (entries 1–18 in CV order)

| # | Date | Title (fr) | Institution | Venue | Role | Notes |
|---|------|------------|-------------|-------|------|-------|
| 1 | 2025 (event) | Président du Sous-comité mobilisation des ressources et partenariats de la 2ème édition du Forum YouthConnekt Sahel 2025 | Forum YouthConnekt Sahel | N'Djamena, Tchad | President | |
| 2 | 12 Sep 2024 – 11 Sep 2025 | Huissier du Consulat Général du Tchad à Istanbul | Consulat Général du Tchad à Istanbul | Istanbul, Turquie | Usher | Note: this might be better modelled as a Position Held (ticket 04), not a Past Participation — long-duration post rather than an event. Decision deferred to Editor. |
| 3 | 17–19 Jan 2023 | Délégué Jeune Leader africain à la 3ème édition de la Conférence africaine pour la paix | Conférence africaine pour la paix | Nouakchott, Mauritanie | Delegate | |
| 4 | 13–15 Oct 2022 | Délégué Jeune — Tchad au 5ème sommet YouthConnektAfrica | YouthConnektAfrica | Kigali, Rwanda | Delegate | |
| 5 | 21–22 Oct 2021 | Facilitateur et rapporteur général du Premier atelier régional des jeunes sur le leadership et la prise de décision sur les questions paix et de sécurité en Afrique centrale | AYAP (Jeune ambassadeur de la paix de l'UA zone Afrique centrale) | Visio-conférence | Facilitator | |
| 6 | 31 Jul 2020 | Descripteur à la 17ème Session des Chefs d'Etat et de Gouvernement de la CEEAC | CEEAC | Visio-conférence (de Yaoundé) | Speaker | Spoke on "quelle stratégie peut-on relancer les activités économiques post Covid-19 dans la zone CEMAC" |
| 7 | 25–26 Jul 2020 | Coordinateur du Forum Virtuel des Organisations de la Jeunesse Africaine (FOVOJA) | Fondation YOUYA | Visio-conférence | Coordinator | |
| 8 | 14 Jun 2020 | Coordinateur de la conférence virtuelle « L'Afrique et la Gouvernance Mondiale » | FYPEJA, MCA, AYA, CLEJ | Visio-conférence | Coordinator | |
| 9 | 12 Feb 2020 | Conférencier sur « le rôle du sociologue dans la société en mutation et l'intégration sous régionale » | Association des étudiants tchadiens en sociologie de l'Université de Yaoundé I | Yaoundé, Cameroun | Speaker | Sub-theme: « la culture de la paix et la gestion de la diversité culturelle dans le processus d'intégration sous-régionale » |
| 10 | 10 Feb 2020 | Conférencier sur « Le leadership communicationnel et la résolution des conflits » | Gen'ABCD section Yaoundé | Yaoundé (Univ. Yaoundé II), Cameroun | Speaker | |
| 11 | Dec 2019 | Membre du Comité Plan et Stratégie de l'AASU lors du 8ème Sommet des Jeunes et Étudiants | Union Panafricaine des Étudiants (AASU) | Rabat, Maroc | Member | See CV for task list |
| 12 | 12–15 Mar 2019 | Participant volontaire au Salon Africain de l'Agriculture (SAFAGRI) | SAFAGRI | (venue in CV not given) | Participant | |
| 13 | 21 Jan – 28 Feb 2019 | Participant au concours de rédaction « L'Afrique que nous voulons » | ADUA/NEPAD | Online | Participant | Theme: « Participation de la jeunesse africaine au développement du continent » |
| 14 | 2021–2022 | Stage professionnel au Secrétariat Exécutif de la CEN-SAD | CEN-SAD | N'Djamena, Tchad | Member |_theme: « L'apport de la CEN-SAD à la consolidation de l'intégration africaine à l'ère de la ZLECAf » — Département des Affaires Economiques et Commerciales. Records as Past Participation rather than Position Held (it was a stage/internship, not a formal appointment). |
| 15 | Dec 2018 – Dec 2020 | Ambassadeur Mondial de la paix | Global Peace Chain | (international) | Ambassador | 2-year tenure. Borderline Position Held vs Past Participation; recording as Past Participation since Global Peace Chain is external, but Editor may choose Position Held. |
| 16 | (undated) | Chargé permanent des missions de l'Association Jeunesse Solidaire de la CEMAC (JS CEMAC) | JS CEMAC | (regional) | Representative | This looks like a Position Held (chargé permanent = "permanent staff"). Editor should consider moving to ticket 04. |
| 17 | 21–22 Sep 2018 | Représentant du Tchad au Symposium National des Jeunes Leaders des partis politiques et de la société civile | Conseil National de la Jeunesse du Cameroun (CNJ/C) | Yaoundé, Cameroun | Representative | Theme: « Jeunesse, Citoyenneté, Paix et Participation au processus électoral » |
| 18 | 2014 | Participant au Salon International de Technologie de l'Information et de la Communication (SITIC) | SITIC | N'Djamena, Tchad | Participant | |

### National (Tchad) — entries 19–31 in CV order

| # | Date | Title (fr) | Institution | Venue | Role | Notes |
|---|------|------------|-------------|-------|------|-------|
| 19 | 2–3 Jun 2023 | Formateur sur le Leadership humanitaire | Association Espoir Pour Tous (A-ESPOT) | siège CNJT, N'Djamena | Trainer | |
| 20 | 4 Jun – 23 Jul 2023 | Membre de l'équipe de représentation nationale de Golden Skay Aviation Service pendant la période de Hajj Tchad 2023 | Golden Skay Aviation Service | N'Djamena, Tchad | Member | |
| 21 | 25 May 2023 | Conférencier sur « Quelle jeunesse Tchadienne pour l'Afrique que nous voulons de l'Agenda 2063 de l'UA » à l'occasion du 60ème anniversaire de l'OUA-UA | Lycée de la Liberté | N'Djamena, Tchad | Speaker | |
| 22 | 7–9 Jul 2022 | Rapporteur des panels des Journées Portes Ouvertes du Programme YouthConnekt Tchad | YouthConnekt Tchad | N'Djamena, Tchad | Rapporteur | |
| 23 | 22 Apr 2022 | Rapporteur au lancement officiel du Programme YouthConnekt-Tchad | YouthConnekt Tchad / PNUD | N'Djamena, Tchad | Rapporteur | |
| 24 | 12 Feb 2021 | Invité de l'émission MATINALE la quotidienne sur TCHAD 24 | TCHAD 24 | TV studio N'Djamena | Speaker | Theme: ZLECAf. Borderline — could be Media Appearance, but our model folds these into Past Participation per ticket 04's grilling notes. |
| 25 | 31 Dec 2020 | Conférencier sur « Internet et Engagement Citoyen » à la 5ème édition de Chad Youth IGF | Chad Youth IGF | Hôtel LEDGER PLAZA, N'Djamena | Speaker | |
| 26 | 23 Mar 2019 | Participant au Salon de l'Emploi et des Métiers Tchad Emploi | Tchad Emploi | N'Djamena | Participant | |
| 27 | Dec 2019 | Team Manager in Hult Prize on Campus at University of N'Djamena | Hult Prize | N'Djamena, Tchad | Coordinator | |
| 28 | 12–17 Nov 2018 | Participant au Salon Mondial de l'Entrepreneuriat | (organizer in CV not given) | N'Djamena, Tchad | Participant | |
| 29 | 17 Nov 2018 | Conférencier sur « Panafricanisme, Agenda 2063 et ODD » | Université HEC-TCHAD | N'Djamena, Tchad | Speaker | |
| 30 | 30 Nov 2018 + 14 Dec 2018 | Conférencier sur « Jeunesse et Engagement Citoyen » | George Washington International Academy / Institut Français du Tchad (IFT) | N'Djamena | Speaker | Two separate events; suggest two Past Participation rows. |
| 31 | 1–30 Sep 2016 | Stage de perfectionnement à la Commission Affaires Etrangères, de l'Intégration Africaine et de la Coopération Internationale | Assemblée Nationale du Tchad | N'Djamena, Tchad | Member | Records as Past Participation per rationale of #14. |

### Distinctions & other qualifications (to be folded in as Past Participation rows with role=`Other` or as Education Entries with `honours_*` if implementation supports)

- Attestation de fin de stage décernée par la CEN-SAD
- Coordinateur Principal Zone Afrique Centrale de la Fondation YOUYA — likely Position Held rather than Past Participation
- Certificat d'Honneur FOVOJA, 25–26 Jul 2020
- Membre du mouvement Changeons l'Afrique (MCA) — likely Position Held
- Attestations AETS/Y-I (12 Feb 2020), Leadership communicationnel (7–10 Feb 2020)
- Élu président du « Groupe de Travail de l'Agenda 2063 » de House of Africa, Jan 2020 — likely Position Held
- Certificat service rendu Comité Plan et Stratégie 2020–2024 AASU
- Attestation 8ème Sommet AASU, Rabat Dec 2019
- Formation ODD (Francophonie/IFDD/Université Senghor) 4 Feb – 31 Mar 2019
- Legal Affairs Advisor Business Woman Africa Chapter of Chad, 2019 — likely Position Held
- Team Manager Hult Prize Campus, Univ. de N'Djamena 2018 — already in #27
- Représentant du Tchad au Salon International de la Jeunesse 2017 et 2018 à Yaoundé
- Attestation GME 2017 à Yaoundé
- Ambassadeur de la paix 2016 (Global Peace Chain) — already in #15
- Attestation participation Forum sous-régional des jeunes CEMAC, 2018 Yaoundé
- Secrétaire Général du Bureau de Vote lors de l'élection présidentielle du 10 Avril 2016 au Tchad — likely Position Held ( electoral officer)

### Scientific work (Travaux scientifiques)

Three academic exposés as student at Université de Yaoundé II in 2019 — could be modelled as Past Participation with role=`Speaker` OR as Articles (site-original academic work) — the Editor decides. Listing here so they're not lost:

1. « Constitution et crises en Afrique » — supervised by Prof. Alain Franklin ONDOUA
2. « Le Régime Parlementaire au Canada » — supervised by Prof. Joseph OWONA
3. « La procédure législative : Analyse comparée en Côte d'Ivoire, France, Cameroun et Gabon » — supervised by Dr Pierre Flambeau NGAYAP (Sénateur/Cameroun)

### Personal data confirmed (relevant for the tagline on ticket 10's About page)

- Born 30/9/1993 at Bongor, Tchad
- Married, one child
- Resident: Ndjari, N'Djamena
- Languages (per the grilling session: only `ar`+`fr` ship on the Profile; English is `medium` only — confirms ADR-0007's choice):
  - French: spoken and written very well
  - Literary Arabic: spoken and written well
  - Local Arabic: spoken very well
  - English: medium
- Phone: +235 66 52 35 33 — NOT to be auto-published on the Profile; the Editor chooses whether and where to surface it via a Position or Contact Content Item (not currently in any ticket's scope). Treat as PII.
- Email: hamidazaz785@gmail.com — same caveat, PII, not auto-published.

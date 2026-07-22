# Hamid — Personal Public Profile

A bilingual (Arabic / French) public-facing website serving as the official online presence of Hamid, a Chadian diplomat and politician. The site functions as a personal public profile: positions held, education, past and upcoming participations, op-eds and essays, plus a gallery. It also exposes a private administration portal through which Hamid (and only Hamid) updates his own content without programmer intervention.

See `CONTEXT.md` for the canonical domain glossary and `docs/adr/` for architecture decisions.

## Agent skills

### Issue tracker

Local markdown — issues live as files under `.scratch/<feature-slug>/issues/NN-<slug>.md`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical role labels with default names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — root `CONTEXT.md` glossary plus `docs/adr/` for hard-to-reverse decisions. See `docs/agents/domain.md`.

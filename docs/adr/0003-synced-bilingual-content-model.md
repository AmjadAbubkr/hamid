# Synced Bilingual Content Model

Each Content Item is a single row carrying paired per-Locale fields (e.g. `title_ar`+`title_fr`, `body_ar`+`body_fr`). The publish action is gated on required paired fields being filled in both Locales; an item cannot be visible to one Locale while empty in the other. We deliberately accept the cost — a breaking-news op-ed cannot go live until both translations are written — because for a diplomat's profile, asymmetric cross-locale publication (Arabic readers seeing a statement hours before French readers, or vice versa) is itself a credibility and protocol risk.

## Considered Options

- Independent per-Locale rows with "translation pending" indicator. Rejected: the asymmetric-publication problem is exactly what we want to prevent.
- Hybrid: short fields synced, long body independent. Rejected: half a policy brief is still half published; the hybrid does not solve the asymmetry problem, it just moves it.

## Consequences

- Portal publish action must enforce locale completeness as a hard gate.
- Every Content Item type must distinguish a Draft state (one or both locales empty or unmarked) from a Published state (both locales complete and approved by the Editor).
- A third Locale (e.g. `en`) added in the future requires extending every table with paired `*_en` columns plus a one-time script to backfill empty values for existing rows; there is no clean staging path.

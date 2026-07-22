# Hosting on Netlify + Supabase

The Profile site is statically prerendered and served from Netlify's CDN; the Portal lives as Netlify Functions calling into a managed Postgres on Supabase. Gallery photos live in Supabase Storage, not in DB columns.

## Considered Options

- Vercel + Neon/Supabase Postgres. Rejected on personal preference: Netlify's UI was preferred for the non-technical handoff.
- Cloudflare Pages + Workers + D1 with Cloudflare Access. Rejected: more moving parts, would have required Workers-specific knowledge to maintain.
- Self-hosted VPS. Rejected: security patches, TLS renewal, and OS upgrades fall on the developer; unacceptable for a low-maintenance political-figure site.

## Consequences

- All content tables live in Supabase Postgres; Row-Level Security policies gate Portal mutations to the authenticated Editor only.
- Passkey auth (see ADR-0004) is implemented through Supabase Auth's WebAuthn support; the one-time numeric recovery code is layered as a custom table + custom code path because Supabase Auth does not ship this feature.
- Deployments are git-triggered; the Profile is rebuilt and re-deployed on every Content Item publish (via a webhook from a Supabase DB trigger → Netlify build hook).
- Image upload is first-class in the Portal — photos are uploaded to Supabase Storage; only a storage key is persisted in the Gallery Photo row.
- Migrations out of Supabase at a later date would be a Postgres dump → restore exercise, so vendor lock-in is low (standard SQL, no Supabase-specific types).

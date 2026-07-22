# Hamid — Personal Public Profile

Bilingual (Arabic / French) public-facing website serving as the official online presence of Hamid, a Chadian diplomat and politician. See [`CONTEXT.md`](./CONTEXT.md) for the canonical domain glossary and [`docs/adr/`](./docs/adr/) for architecture decisions.

## Stack

- **Next.js 16** (App Router, TypeScript, src-dir layout)
- **Tailwind v4** (CSS-first config via `@tailwindcss/postcss`)
- **Vitest** + **React Testing Library** (jsdom) for tests
- **Supabase** (`@supabase/supabase-js`) for data and auth
- **Netlify** for hosting (via `@netlify/plugin-nextjs`)

## Local development

```bash
cp .env.example .env          # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev                   # http://localhost:3000 → redirects to /ar
```

Visit `http://localhost:3000/ar` (Arabic, RTL) or `http://localhost:3000/fr` (French, LTR).

## Common scripts

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # eslint (flat config + custom local rules)
npm run test         # vitest run (single pass)
npm run test:watch   # vitest watch mode
npm run test:ui      # vitest UI
```

TypeScript typecheck:

```bash
npx tsc --noEmit
```

## Deploy workflow

The site is built to deploy to **Netlify** on every `git push** via `@netlify/plugin-nextjs`. The [`netlify.toml`](./netlify.toml) declares the build command, publish directory (`.next`), and the Next.js plugin.

**One-time setup (not yet done):** connect a Netlify site to this repo's git remote and add the following environment variables in the Netlify dashboard under **Site settings → Environment variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Once connected, every `git push` produces a Netlify deploy preview URL. Until the site is connected, `netlify.toml` alone does not produce deploys — local `npm run build` is the verification path.

## Portal bootstrap and passkeys

The Portal has no public signup and no password login. Before first use, create a Supabase project, apply the migrations in [`supabase/migrations`](./supabase/migrations), enable the experimental **Passkeys** provider, and register the local/production redirect origins and a stable WebAuthn RP ID. Changing the RP ID invalidates existing passkeys.

Set these server-only values locally and in Netlify (never expose the service-role key to the browser):

```bash
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_EDITOR_EMAIL=...
NEXT_PUBLIC_SITE_URL=https://your-site.example
```

Then run the one-time bootstrap command:

```bash
npm run bootstrap:editor
```

It creates the sole Editor identity and prints one short-lived bootstrap link. Open it in a browser, enroll a passkey, then store the one-time numeric recovery code offline. The normal Portal login only uses a passkey.

Recovery uses the approved narrow exception: after a matching recovery code is consumed, the server redirects the browser through a one-time magic-link bridge solely to establish the temporary session that Supabase requires for new passkey enrollment. The bridge URL is never returned by the Portal API. An arbitrary incorrect code is not consumed, preventing an attacker from permanently locking out the Editor by guessing; every response remains generic.

### Content publish rebuild hook

The Profile is rebuilt when a Position Held or Education Entry first moves from Draft to Published. Create a Netlify build hook, enable `pg_net` in Supabase Database Extensions, and save the hook URL in Supabase Vault as `netlify_build_hook_url`. The migrations read that secret only inside database triggers and send asynchronous POSTs after publication; it is never a browser variable or a repository value. Without that configured Vault secret, publication still succeeds but no static rebuild is requested.

## Project conventions

- **RTL convention (ADR-0008):** all layout utilities in `className` MUST use Tailwind logical-property utilities (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`). Physical-direction utilities (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`, etc.) are **banned by a custom ESLint rule** at [`eslint-rules/no-physical-tailwind.ts`](./eslint-rules/no-physical-tailwind.ts) and registered in [`eslint.config.mjs`](./eslint.config.mjs) under the local plugin name `hamid-local/no-physical-tailwind`.
- **Locales (ADR-0007):** exactly two — `ar` (Arabic, RTL) and `fr` (French, LTR). Defined in [`src/lib/i18n/locales.ts`](./src/lib/i18n/locales.ts). No third Locale is supported; adding one is a project-sized migration per ADR-0007.
- **Document direction (ADR-0008):** `<html dir dir="rtl"|"ltr" lang="ar"|"fr">` is set per-Locale at the document root by the `[locale]/layout.tsx` layout on the server, so crawlers and screen readers see the correct `lang` and `dir` from first paint. The `LocaleDocumentDirector` client component additionally re-applies `dir`/`lang` after hydration so route flips via client-side navigation (e.g. `/ar` → `/fr` links) change direction deterministically without a full page reload.
- **Canonical-URL footer (ADR-0009 §3):** every public page renders the page's own canonical URL in a `<footer>` element so screenshots can be verified against the URL.

## Glossary and architecture decisions

- [`CONTEXT.md`](./CONTEXT.md) — domain glossary (Subject, Editor, Visitor, Profile, Portal, Locale, Content Item, Draft, Published, ...).
- [`docs/adr/`](./docs/adr/) — nine ADRs: split Upcoming/Past Participation, Articles site-original-only, synced bilingual model, passkey auth, Netlify+Supabase hosting, `.com`-only domain, two-locale ceiling, RTL logical properties, absence behavior.

## Issue tracker

Tickets live as local markdown files under `.scratch/<feature-slug>/issues/NN-<slug>.md`. See [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md). Current frontier: `.scratch/hamid-portfolio/issues/`.

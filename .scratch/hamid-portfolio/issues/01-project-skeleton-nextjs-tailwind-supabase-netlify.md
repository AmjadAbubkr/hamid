# 01 — Project skeleton: Next.js + Tailwind + Supabase on Netlify

**What to build:** A deployable Next.js (App Router) project with Tailwind configured to enforce Tailwind logical-property utilities only (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, etc.) and to reject physical-direction utilities (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, etc.) via a lint rule (ADR-0008). The `supabase-js` client is wired with environment-variable-driven URL + anon key. A single placeholder landing page renders in both Locales (`ar`, RTL; `fr`, LTR), with `<html dir="auto" lang="ar|fr">` switched per locale, demonstrating the RTL/LTR machinery works. The project deploys to Netlify on `git push` and the deploy preview URL is reachable. No Supabase schema, no auth, no Portal, no real Content Items yet — just the empty track everything else lays onto.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `package.json` initializes a Next.js App Router project with TypeScript and Tailwind
- [ ] A lint rule (ESLint custom rule or stylelint plugin) bans physical-direction Tailwind utility classes on `className` tokens; a sample `text-left` triggers a lint failure
- [ ] `supabase-js` client is initialized from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars with a typed singleton accessor
- [ ] A root `<html>` element renders with `dir="auto"` and `lang` set per current Locale; a switch between `/ar` and `/fr` placeholder routes changes direction without page reload artifacts
- [ ] Tailwind logical-property utilities render correctly in both directions on a small demo card (text alignment, padding, border radius)
- [ ] `netlify.toml` is configured for Next.js (`@netlify/plugin-nextjs`) and a successful deploy preview URL is produced on `git push`
- [ ] README documents local dev (`npm run dev`), lint (`npm run lint`), and deploy workflow

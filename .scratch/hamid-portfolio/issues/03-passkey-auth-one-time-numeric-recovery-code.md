# 03 — Passkey auth + one-time numeric recovery code

**What to build:** The Portal authentication path per ADR-0004. The Editor (Hamid, by design) reaches a bare `/portal/login` page, enrolls a passkey via Supabase Auth's WebAuthn support (platform authenticator — Touch ID / Face ID / Windows Hello — or a hardware key), and lands on a logged-in `/portal` page reading "Logged in as Hamid / Editor". A one-time numeric recovery code is generated at first enrollment, shown to the Editor exactly once, and is the only fallback when all enrolled passkeys are lost.

The recovery flow: Editor visits `/portal/recover`, enters the numeric code, the code is verified single-use (immediately invalidated on success or failure) and a forced passkey re-enrollment screen appears. On re-enrollment the Editor must enroll at least one new passkey before they can navigate anywhere else in the Portal. A recovery code cannot be reused to log in directly — its only effect is unlocking the re-enrollment flow.

Account provisioning (the very first passkey enrollment on a brand-new Supabase project) is a one-time developer bootstrap run from the command line — the Portal exposes no public signup. This is documented in the ticket's README.

**Blocked by:** 01 — Project skeleton: Next.js + Tailwind + Supabase on Netlify

**Status:** ready-for-agent

- [ ] `/portal/login` route enrolls a passkey via Supabase Auth WebAuthn; the enrolled credential is stored in Supabase Auth's WebAuthn credentials table
- [ ] A `recovery_codes` table holds single-use numeric codes (16+ digits, generated securely), hashed at rest, with `used_at` and `issued_at` timestamps
- [ ] At first passkey enrollment, exactly one numeric recovery code is generated and shown to the Editor on a one-time-view page with explicit "store offline — you will not see this again" copy
- [ ] `/portal/recover` accepts a numeric code, validates against hashed recovery codes, marks `used_at = now()` on success or failure, never reveals which code failed vs succeeded, and on success forces the Editor through a new passkey enrollment flow
- [ ] Re-enrollment is mandatory: a recovery session cannot navigate anywhere in `/portal/*` except the re-enrollment screen until at least one new passkey is enrolled
- [ ] The first-ever Editor account is created via a documented developer script (`npm run bootstrap:editor`), not via the Portal UI; the script is referenced in the README
- [ ] Logout fully clears the Supabase Auth session; returning to `/portal/*` without re-auth always redirects to `/portal/login`

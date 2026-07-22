# Portal Authentication: Passkey + One-Time Numeric Recovery Code

The Portal is the single most security-critical surface of the entire site: an attacker who logs in as the Editor can republish fake statements under the Subject's name, defacing the Profile and doing reputational damage that no amount of subsequent "that wasn't me" can fully undo. We therefore authenticate the Editor with passkeys only (WebAuthn platform authenticators — Touch ID / Face ID / Windows Hello — and/or hardware security keys), with a one-time numeric recovery code issued at enrollment and to be stored offline as the sole fallback for catastrophic device loss.

## Considered Options

- Email + password + TOTP. Rejected: passwords are phishable, TOTP codes are phishable in real time, and the email account itself becomes a single point of compromise for the Portal.
- Magic login link via email. Rejected: the email account becomes the only credential; if his email is breached (a common attack against political figures), the Portal falls trivially.
- OAuth/SSO via Google or GitHub. Rejected: ties access to a third-party whose deactivation would lock him out of his own site, and adds an external party that could be subpoenaed or socially engineered.

## Consequences

- No password is ever stored or hashed; there is no password column in the Editor table.
- At least one passkey must be enrolled at first login; recovery code is generated and shown exactly once at that moment.
- The Editor table holds: a stable Editor id, a display name, one row per passkey credential (multiple passkeys are encouraged, one per personal device).
- Recovery flow verifies the recovery code and *immediately invalidates it*; the code cannot be reused, and on use the Editor is required to enroll at least one new passkey.
- Account provisioning / first device enrollment is a privileged one-time bootstrap performed by a developer, documented separately; the Portal offers no public signup.

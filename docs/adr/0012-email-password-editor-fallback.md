# Email + Password Editor Fallback

The Portal keeps passkeys as the preferred Editor login method, but also permits email and password authentication as a recovery fallback.

## Decision

- There is no public Portal registration or signup flow.
- Only an existing Editor account created through a private Supabase invitation can use email and password login.
- The Portal offers a password-reset request form that does not disclose whether an email address belongs to an Editor account.
- The reset link completes through the existing Supabase callback and requires the Editor to set a new password while authenticated.

## Consequences

This supersedes the passkey-only restriction in ADR 0004. A password is less phishing-resistant than a passkey, but it provides a practical recovery path when a device or passkey is unavailable, including after an unrelated domain migration.

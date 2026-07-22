-- Portal recovery codes and mandatory passkey re-enrollment state.
--
-- Recovery code plaintext never reaches Postgres: Node creates a random 20-digit
-- code, stores only its salted scrypt hash, and shows the plaintext once. Both
-- tables are written by server-only code using the Supabase service-role key.

create table if not exists public.recovery_codes (
  id         uuid primary key default gen_random_uuid(),
  editor_id  uuid not null references public.editors(id) on delete restrict,
  code_hash  text not null check (length(code_hash) > 0),
  issued_at  timestamptz not null default now(),
  used_at    timestamptz,
  constraint recovery_codes_used_after_issued_check check (
    used_at is null or used_at >= issued_at
  )
);

-- The current recovery code is the only code that can be redeemed. Historical
-- consumed rows remain only as an audit trail and can never become active again.
create unique index if not exists recovery_codes_one_active_per_editor_idx
  on public.recovery_codes (editor_id)
  where used_at is null;

alter table public.recovery_codes enable row level security;
revoke all on table public.recovery_codes from public, anon, authenticated;

-- A successful recovery consumes its code before it can create this short-lived
-- state. The raw random token is held only in a HttpOnly cookie; this table holds
-- a SHA-256 digest so a database disclosure does not become a portal session.
create table if not exists public.recovery_enrollment_sessions (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  token_hash   text not null check (length(token_hash) > 0),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  completed_at timestamptz,
  constraint recovery_enrollment_sessions_expiry_check check (expires_at > created_at),
  constraint recovery_enrollment_sessions_completed_after_created_check check (
    completed_at is null or completed_at >= created_at
  )
);

create unique index if not exists recovery_enrollment_sessions_one_active_per_user_idx
  on public.recovery_enrollment_sessions (auth_user_id)
  where completed_at is null;

alter table public.recovery_enrollment_sessions enable row level security;
revoke all on table public.recovery_enrollment_sessions from public, anon, authenticated;

-- Once the magic-link bridge has authenticated the Editor, the normal SSR client
-- may inspect only that Editor's own session. It cannot create, complete, extend,
-- or enumerate another session.
grant select on public.recovery_enrollment_sessions to authenticated;
drop policy if exists recovery_enrollment_sessions_authenticated_select_own
  on public.recovery_enrollment_sessions;
create policy recovery_enrollment_sessions_authenticated_select_own
  on public.recovery_enrollment_sessions
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- Editors table: the people who can write Content Items.
-- Per ADR-0004, the only Editor by design is the Subject (Hamid). The role is
-- distinct from the Subject because future delegation scenarios (chief of staff,
-- press officer) must be modelled explicitly, not silently broadened.
-- Ticket 03 adds passkey and recovery-code tables on top of this identity link.

-- gen_random_uuid() is built into Postgres 13+ (no pgcrypto extension needed).

create table if not exists public.editors (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- RLS policies call this instead of granting authenticated actors direct
-- read access to the Editor identity table.
create or replace function public.current_editor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.editors where auth_user_id = auth.uid();
$$;

revoke execute on function public.current_editor_id() from public;

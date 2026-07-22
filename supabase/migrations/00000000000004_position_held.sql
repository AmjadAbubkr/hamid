-- position_held: the pattern-exemplar Content Item table per ticket 02.
-- Every Content Item table created in tickets 04–09 follows this same shape:
--   - shared columns: id, slug, status, title_ar, title_fr, body_ar, body_fr,
--     author_editor_id, created_at, updated_at, published_at
--   - type-specific columns: institution, start_date, end_date, location
--   - slug UNIQUE
--   - status enum defaulting to 'draft', published_at NULL until published
--   - RLS enabled: anon SELECT only published; authenticated Editor full DML
--   - trigger enforcing the bilingual publish gate

create table if not exists public.position_held (
  -- shared Content Item columns
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  status          public.content_item_status not null default 'draft',
  title_ar        text not null default '',
  title_fr        text not null default '',
  body_ar         text,
  body_fr         text,
  author_editor_id uuid not null references public.editors(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz,

  -- type-specific fields. These may be incomplete while Draft; publication
  -- validation below requires institution, start_date, and location. A NULL
  -- end_date means the Position Held is current ("present").
  institution     text,
  start_date      date,
  end_date        date,
  location        text,

  constraint position_held_slug_key unique (slug),
  constraint position_held_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint position_held_end_date_check check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index if not exists position_held_status_idx on public.position_held (status);
create index if not exists position_held_author_editor_id_idx on public.position_held (author_editor_id);

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists position_held_touch_updated_at on public.position_held;
create trigger position_held_touch_updated_at
  before update on public.position_held
  for each row execute function public.touch_updated_at();

-- Publish gate trigger: validates every Published row on INSERT and UPDATE.
-- Direct INSERT/UPDATE -> status='published' is rejected; the only path from
-- Draft to Published is SELECT publish_content_item().
create or replace function public.position_held_prevent_bypass_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''position_held'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''position_held'', <id>) to publish a Content Item.'
        using errcode = '23514';
    end if;

    perform public.validate_content_item_publish(
      new.status, new.title_ar, new.title_fr, new.body_ar, new.body_fr, new.published_at
    );

    if coalesce(btrim(new.institution), '') = '' then
      raise exception 'Cannot publish: institution is empty.' using errcode = '23514';
    end if;
    if new.start_date is null then
      raise exception 'Cannot publish: start date is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.location), '') = '' then
      raise exception 'Cannot publish: location is empty.' using errcode = '23514';
    end if;
    if new.end_date is not null and new.end_date < new.start_date then
      raise exception 'Cannot publish: end date cannot precede start date.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists position_held_prevent_bypass_publish on public.position_held;
create trigger position_held_prevent_bypass_publish
  before insert or update on public.position_held
  for each row execute function public.position_held_prevent_bypass_publish();

-- publish_content_item(item_type, item_id): the gate function.
-- Validates Locale completeness, confirms the caller owns the item, and flips
-- status + published_at atomically. Its SECURITY DEFINER context is the only
-- trusted signal that the publish trigger accepts.
create or replace function public.publish_content_item(
  item_type text,
  item_id   uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  title_ar_value   text;
  title_fr_value   text;
  body_ar_value    text;
  body_fr_value    text;
  current_status   public.content_item_status;
  author_editor_id_value uuid;
  stmt             text;
begin
  if item_type is null or item_id is null then
    raise exception 'publish_content_item requires a non-null item_type and item_id.'
      using errcode = '22023';
  end if;

  -- Dynamic SQL is required here because the Content Item tables share a SHAPE
  -- but not a single parent table (the schema uses one table per Content Item type).
  -- The item_type parameter is constrained to known table names below to prevent
  -- SQL injection via identifier interpolation.
  if item_type not in ('position_held') then
    raise exception 'Unknown Content Item type ''%''', item_type
      using errcode = '22023';
  end if;

  stmt := format('SELECT status, title_ar, title_fr, body_ar, body_fr, author_editor_id FROM %I WHERE id = $1', item_type);
  execute stmt into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
    using item_id;

  -- EXECUTE INTO does not set FOUND; use the local-status as a nullness check.
  -- current_status is NOT NULL on the column, so it is null here iff no row matched.
  if current_status is null then
    raise exception 'Content Item of type ''%'' with id % not found.', item_type, item_id
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.editors
    where id = author_editor_id_value and auth_user_id = auth.uid()
  ) then
    raise exception 'Not authorized to publish this Content Item.' using errcode = '42501';
  end if;

  -- Validate before mutation so the user gets a precise error.
  perform public.validate_content_item_publish(
    'published', title_ar_value, title_fr_value, body_ar_value, body_fr_value, now()
  );

  stmt := format(
    'UPDATE %I SET status = ''published'', published_at = now() WHERE id = $1 AND status <> ''published''',
    item_type
  );
  execute stmt using item_id;
end;
$$;

-- Row-Level Security
alter table public.position_held enable row level security;

-- Grant base access: anon can read; authenticated Editors get DML via policies.
grant select on public.position_held to anon;
grant select, insert, update, delete on public.position_held to authenticated;

-- anon SELECT: only published rows.
drop policy if exists position_held_anon_select_published on public.position_held;
create policy position_held_anon_select_published
  on public.position_held
  for select
  to anon
  using (status = 'published');

-- authenticated Editor SELECT: all rows they own.
drop policy if exists position_held_authenticated_select_own on public.position_held;
create policy position_held_authenticated_select_own
  on public.position_held
  for select
  to authenticated
  using (author_editor_id = public.current_editor_id());

-- authenticated Editor INSERT: must be the author.
drop policy if exists position_held_authenticated_insert_own on public.position_held;
create policy position_held_authenticated_insert_own
  on public.position_held
  for insert
  to authenticated
  with check (author_editor_id = public.current_editor_id());

-- authenticated Editor UPDATE: must be the author.
drop policy if exists position_held_authenticated_update_own on public.position_held;
create policy position_held_authenticated_update_own
  on public.position_held
  for update
  to authenticated
  using (author_editor_id = public.current_editor_id())
  with check (author_editor_id = public.current_editor_id());

-- authenticated Editor DELETE: must be the author.
drop policy if exists position_held_authenticated_delete_own on public.position_held;
create policy position_held_authenticated_delete_own
  on public.position_held
  for delete
  to authenticated
  using (author_editor_id = public.current_editor_id());

-- Grants on shared functions / enums
revoke execute on function public.publish_content_item(text, uuid) from public;
revoke execute on function public.validate_content_item_publish(public.content_item_status, text, text, text, text, timestamptz) from public;
grant execute on function public.validate_content_item_publish(public.content_item_status, text, text, text, text, timestamptz) to authenticated;
grant execute on function public.publish_content_item(text, uuid) to authenticated;
grant execute on function public.touch_updated_at() to authenticated;
grant usage on type public.content_item_status to anon, authenticated;

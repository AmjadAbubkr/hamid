-- Education Entry: a bilingual Content Item rendered after Positions in Career.
-- Degree and institution are paired because both are visitor-facing facts. A
-- shared location and dates match the Position Held timeline shape.

create table if not exists public.education_entry (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null,
  status           public.content_item_status not null default 'draft',
  degree_ar        text not null default '',
  degree_fr        text not null default '',
  institution_ar   text not null default '',
  institution_fr   text not null default '',
  honours_ar       text,
  honours_fr       text,
  start_date       date,
  end_date         date,
  location         text,
  author_editor_id uuid not null references public.editors(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,

  constraint education_entry_slug_key unique (slug),
  constraint education_entry_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint education_entry_end_date_check check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index if not exists education_entry_status_idx
  on public.education_entry (status);
create index if not exists education_entry_author_editor_id_idx
  on public.education_entry (author_editor_id);

drop trigger if exists education_entry_touch_updated_at on public.education_entry;
create trigger education_entry_touch_updated_at
  before update on public.education_entry
  for each row execute function public.touch_updated_at();

-- The trigger is the second publication gate. It protects direct SQL writes as
-- well as the RPC path, while the RPC below authorizes the owning Editor.
create or replace function public.education_entry_prevent_bypass_publish()
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
      raise exception 'Direct publication is forbidden. Call publish_content_item(''education_entry'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''education_entry'', <id>) to publish a Content Item.'
        using errcode = '23514';
    end if;

    -- Treat degree as the Content Item title and honours as its optional body.
    -- The shared validator requires the degree pair and honours pair atomically.
    perform public.validate_content_item_publish(
      new.status,
      new.degree_ar,
      new.degree_fr,
      new.honours_ar,
      new.honours_fr,
      new.published_at
    );

    if coalesce(btrim(new.institution_ar), '') = '' then
      raise exception 'Cannot publish: Arabic institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_fr), '') = '' then
      raise exception 'Cannot publish: French institution is empty.' using errcode = '23514';
    end if;
    if new.start_date is null then
      raise exception 'Cannot publish: start date is empty.' using errcode = '23514';
    end if;
    if new.end_date is null then
      raise exception 'Cannot publish: end date is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.location), '') = '' then
      raise exception 'Cannot publish: location is empty.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists education_entry_prevent_bypass_publish on public.education_entry;
create trigger education_entry_prevent_bypass_publish
  before insert or update on public.education_entry
  for each row execute function public.education_entry_prevent_bypass_publish();

-- Extend the fixed allow-list of Content Item tables. This deliberately avoids
-- interpolating an arbitrary table or column name into dynamic SQL.
create or replace function public.publish_content_item(
  item_type text,
  item_id   uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  title_ar_value       text;
  title_fr_value       text;
  body_ar_value        text;
  body_fr_value        text;
  current_status       public.content_item_status;
  author_editor_id_value uuid;
begin
  if item_type is null or item_id is null then
    raise exception 'publish_content_item requires a non-null item_type and item_id.'
      using errcode = '22023';
  end if;

  if item_type = 'position_held' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.position_held
      where id = item_id;
  elsif item_type = 'education_entry' then
    select status, degree_ar, degree_fr, honours_ar, honours_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.education_entry
      where id = item_id;
  else
    raise exception 'Unknown Content Item type ''%''', item_type
      using errcode = '22023';
  end if;

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

  perform public.validate_content_item_publish(
    'published', title_ar_value, title_fr_value, body_ar_value, body_fr_value, now()
  );

  if item_type = 'position_held' then
    update public.position_held
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  else
    update public.education_entry
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

alter table public.education_entry enable row level security;

grant select on public.education_entry to anon;
grant select, insert, update, delete on public.education_entry to authenticated;

drop policy if exists education_entry_anon_select_published on public.education_entry;
create policy education_entry_anon_select_published
  on public.education_entry
  for select to anon
  using (status = 'published');

drop policy if exists education_entry_authenticated_select_own on public.education_entry;
create policy education_entry_authenticated_select_own
  on public.education_entry
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

drop policy if exists education_entry_authenticated_insert_own on public.education_entry;
create policy education_entry_authenticated_insert_own
  on public.education_entry
  for insert to authenticated
  with check (author_editor_id = public.current_editor_id());

drop policy if exists education_entry_authenticated_update_own on public.education_entry;
create policy education_entry_authenticated_update_own
  on public.education_entry
  for update to authenticated
  using (author_editor_id = public.current_editor_id())
  with check (author_editor_id = public.current_editor_id());

drop policy if exists education_entry_authenticated_delete_own on public.education_entry;
create policy education_entry_authenticated_delete_own
  on public.education_entry
  for delete to authenticated
  using (author_editor_id = public.current_editor_id());

-- Match the Position Held build hook: Vault and pg_net are optional locally,
-- and no remote failure may block the already-authorized database publish.
create or replace function public.request_education_entry_profile_rebuild()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hook_url text;
begin
  begin
    execute
      'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
      into hook_url
      using 'netlify_build_hook_url';
  exception
    when invalid_schema_name or undefined_table then
      return new;
  end;

  if hook_url is null or btrim(hook_url) = '' then
    return new;
  end if;

  begin
    execute 'select net.http_post($1, $2, $3, $4)'
      using
        hook_url,
        jsonb_build_object(
          'content_item', 'education_entry',
          'id', new.id,
          'slug', new.slug,
          'published_at', new.published_at
        ),
        '{}'::jsonb,
        jsonb_build_object('Content-Type', 'application/json');
  exception
    when invalid_schema_name or undefined_function then
      return new;
  end;

  return new;
end;
$$;

revoke execute on function public.request_education_entry_profile_rebuild() from public;

drop trigger if exists education_entry_publish_netlify_rebuild on public.education_entry;
create trigger education_entry_publish_netlify_rebuild
  after update of status on public.education_entry
  for each row
  when (old.status = 'draft' and new.status = 'published')
  execute function public.request_education_entry_profile_rebuild();

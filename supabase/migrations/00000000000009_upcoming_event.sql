-- Upcoming Event: a future public appearance. Published rows are moved to the
-- immutable Past Participation record after their scheduled date passes.

create table if not exists public.upcoming_event (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null,
  status             public.content_item_status not null default 'draft',
  title_ar           text not null default '',
  title_fr           text not null default '',
  body_ar            text,
  body_fr            text,
  event_date         date,
  venue_ar           text not null default '',
  venue_fr           text not null default '',
  institution_ar     text not null default '',
  institution_fr     text not null default '',
  role               public.participation_role default 'Speaker',
  role_other_ar      text,
  role_other_fr      text,
  registration_url   text,
  author_editor_id   uuid not null references public.editors(id) on delete restrict,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz,

  constraint upcoming_event_slug_key unique (slug),
  constraint upcoming_event_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create index if not exists upcoming_event_status_idx
  on public.upcoming_event (status);
create index if not exists upcoming_event_event_date_idx
  on public.upcoming_event (event_date asc);
create index if not exists upcoming_event_author_editor_id_idx
  on public.upcoming_event (author_editor_id);

drop trigger if exists upcoming_event_touch_updated_at on public.upcoming_event;
create trigger upcoming_event_touch_updated_at
  before update on public.upcoming_event
  for each row execute function public.touch_updated_at();

-- Published events remain editable until their date passes, but every such
-- edit is validated. The trusted publish RPC is the only draft-to-published
-- path; role metadata obeys the same bilingual rule as Past Participation.
create or replace function public.upcoming_event_prevent_bypass_publish()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    raise exception 'Published Upcoming Events cannot return to draft.'
      using errcode = '23514';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''upcoming_event'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''upcoming_event'', <id>) to publish a Content Item.'
        using errcode = '23514';
    end if;

    perform public.validate_content_item_publish(
      new.status,
      new.title_ar,
      new.title_fr,
      new.body_ar,
      new.body_fr,
      new.published_at
    );

    if new.event_date is null then
      raise exception 'Cannot publish: event date is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.venue_ar), '') = '' then
      raise exception 'Cannot publish: Arabic venue is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.venue_fr), '') = '' then
      raise exception 'Cannot publish: French venue is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_ar), '') = '' then
      raise exception 'Cannot publish: Arabic institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_fr), '') = '' then
      raise exception 'Cannot publish: French institution is empty.' using errcode = '23514';
    end if;
    if new.role is null then
      raise exception 'Cannot publish: role is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_ar), '') <> ''
       and coalesce(btrim(new.role_other_fr), '') = '' then
      raise exception 'Cannot publish: French other role is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_fr), '') <> ''
       and coalesce(btrim(new.role_other_ar), '') = '' then
      raise exception 'Cannot publish: Arabic other role is empty.' using errcode = '23514';
    end if;
    if new.role = 'Other'
       and (
         coalesce(btrim(new.role_other_ar), '') = ''
         or coalesce(btrim(new.role_other_fr), '') = ''
       ) then
      raise exception 'Cannot publish: both Locales of the other role are required.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists upcoming_event_prevent_bypass_publish on public.upcoming_event;
create trigger upcoming_event_prevent_bypass_publish
  before insert or update on public.upcoming_event
  for each row execute function public.upcoming_event_prevent_bypass_publish();

-- Fixed branches keep the table/column mapping auditable and never interpolate
-- caller-controlled identifiers into SQL.
create or replace function public.publish_content_item(
  item_type text,
  item_id   uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  title_ar_value        text;
  title_fr_value        text;
  body_ar_value         text;
  body_fr_value         text;
  current_status        public.content_item_status;
  author_editor_id_value uuid;
begin
  if item_type is null or item_id is null then
    raise exception 'publish_content_item requires a non-null item_type and item_id.'
      using errcode = '22023';
  end if;

  if item_type = 'position_held' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.position_held where id = item_id;
  elsif item_type = 'education_entry' then
    select status, degree_ar, degree_fr, honours_ar, honours_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.education_entry where id = item_id;
  elsif item_type = 'past_participation' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.past_participation where id = item_id;
  elsif item_type = 'upcoming_event' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.upcoming_event where id = item_id;
  else
    raise exception 'Unknown Content Item type ''%''', item_type
      using errcode = '22023';
  end if;

  if current_status is null then
    raise exception 'Content Item of type ''%'' with id % not found.', item_type, item_id
      using errcode = '23503';
  end if;

  if not exists (
    select 1 from public.editors
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
  elsif item_type = 'education_entry' then
    update public.education_entry
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  elsif item_type = 'past_participation' then
    update public.past_participation
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  else
    update public.upcoming_event
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

alter table public.upcoming_event enable row level security;

grant select on public.upcoming_event to anon;
grant select, insert, update, delete on public.upcoming_event to authenticated;

drop policy if exists upcoming_event_anon_select_published on public.upcoming_event;
create policy upcoming_event_anon_select_published
  on public.upcoming_event
  for select to anon
  using (status = 'published');

drop policy if exists upcoming_event_authenticated_select_own on public.upcoming_event;
create policy upcoming_event_authenticated_select_own
  on public.upcoming_event
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

drop policy if exists upcoming_event_authenticated_insert_own on public.upcoming_event;
create policy upcoming_event_authenticated_insert_own
  on public.upcoming_event
  for insert to authenticated
  with check (author_editor_id = public.current_editor_id());

drop policy if exists upcoming_event_authenticated_update_own on public.upcoming_event;
create policy upcoming_event_authenticated_update_own
  on public.upcoming_event
  for update to authenticated
  using (author_editor_id = public.current_editor_id())
  with check (author_editor_id = public.current_editor_id());

drop policy if exists upcoming_event_authenticated_delete_own on public.upcoming_event;
create policy upcoming_event_authenticated_delete_own
  on public.upcoming_event
  for delete to authenticated
  using (author_editor_id = public.current_editor_id());

-- Move every expired event. A Published row becomes a Published historical
-- record; an incomplete Draft becomes a Draft historical record, which keeps
-- it private without leaving a stale future event in the editor's list. The
-- locked CTE and matching DELETE make this a single transaction. The exact
-- ISO date becomes the display label required by Past Participation.
create or replace function public.archive_expired_upcoming_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer;
begin
  with expired as (
    select *
    from public.upcoming_event
    where event_date < current_date
    for update skip locked
  ), archived as (
    insert into public.past_participation (
      id, slug, status, title_ar, title_fr, body_ar, body_fr,
      event_date, event_date_label, venue_ar, venue_fr,
      institution_ar, institution_fr, role, role_other_ar, role_other_fr,
      source_url, author_editor_id, created_at, updated_at, published_at
    )
    select
      id,
      case when exists (
        select 1 from public.past_participation
        where slug = expired.slug
      ) then expired.slug || '-archived-' || replace(expired.id::text, '-', '')
      else expired.slug end,
      case when status = 'published'
        then 'published'::public.content_item_status
        else 'draft'::public.content_item_status
      end,
      title_ar, title_fr, body_ar, body_fr,
      event_date, to_char(event_date, 'YYYY-MM-DD'), venue_ar, venue_fr,
      institution_ar, institution_fr, role, role_other_ar, role_other_fr,
      registration_url, author_editor_id, created_at, updated_at,
      case when status = 'published' then published_at else null end
    from expired
    returning id
  )
  delete from public.upcoming_event event
  using archived
  where event.id = archived.id;

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

revoke execute on function public.archive_expired_upcoming_events() from public, anon, authenticated;

-- Build requests are best-effort: local PGlite and hosted projects that have
-- not configured Vault/pg_net simply continue without a remote request.
create or replace function public.request_upcoming_event_profile_rebuild()
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
          'content_item', 'upcoming_event',
          'action', 'published',
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

revoke execute on function public.request_upcoming_event_profile_rebuild() from public;

drop trigger if exists upcoming_event_publish_netlify_rebuild on public.upcoming_event;
create trigger upcoming_event_publish_netlify_rebuild
  after update on public.upcoming_event
  for each row
  when (new.status = 'published')
  execute function public.request_upcoming_event_profile_rebuild();

create or replace function public.request_upcoming_event_archive_profile_rebuild()
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
      return old;
  end;

  if hook_url is null or btrim(hook_url) = '' then
    return old;
  end if;

  begin
    execute 'select net.http_post($1, $2, $3, $4)'
      using
        hook_url,
        jsonb_build_object(
          'content_item', 'upcoming_event',
          'action', 'archived',
          'id', old.id,
          'slug', old.slug,
          'event_date', old.event_date
        ),
        '{}'::jsonb,
        jsonb_build_object('Content-Type', 'application/json');
  exception
    when invalid_schema_name or undefined_function then
      return old;
  end;

  return old;
end;
$$;

revoke execute on function public.request_upcoming_event_archive_profile_rebuild() from public;

drop trigger if exists upcoming_event_archive_netlify_rebuild on public.upcoming_event;
create trigger upcoming_event_archive_netlify_rebuild
  after delete on public.upcoming_event
  for each row
  when (old.status = 'published')
  execute function public.request_upcoming_event_archive_profile_rebuild();

-- pg_cron is enabled only in hosted projects that install it. Dynamic SQL
-- prevents PGlite from resolving cron relations/functions during local tests.
do $$
declare
  has_schedule boolean;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_namespace where nspname = 'cron') then
    execute 'select exists (select 1 from cron.job where jobname = $1)'
      into has_schedule
      using 'archive_expired_upcoming_events_daily';

    if not has_schedule then
      execute 'select cron.schedule($1, $2, $3)'
        using
          'archive_expired_upcoming_events_daily',
          '5 0 * * *',
          'select public.archive_expired_upcoming_events();';
    end if;
  end if;
exception
  when invalid_schema_name or undefined_table or undefined_function or insufficient_privilege then
    null;
end;
$$;

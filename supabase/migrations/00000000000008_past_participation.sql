-- Past Participation: permanent historical appearances in the Career record.
-- event_date_label preserves the source's exact year/range wording alongside
-- the sortable event_date used by the Profile timeline.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'participation_role'
  ) then
    create type public.participation_role as enum (
      'Speaker', 'Panelist', 'Host', 'Delegate', 'Rapporteur', 'Facilitator',
      'Coordinator', 'usher', 'President', 'Representative', 'Ambassador',
      'Trainer', 'Member', 'Participant', 'Other'
    );
  end if;
end $$;

create table if not exists public.past_participation (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null,
  status           public.content_item_status not null default 'draft',
  title_ar         text not null default '',
  title_fr         text not null default '',
  body_ar          text,
  body_fr          text,
  event_date       date,
  event_end_date   date,
  event_date_label text not null default '',
  venue_ar         text not null default '',
  venue_fr         text not null default '',
  institution_ar   text not null default '',
  institution_fr   text not null default '',
  role             public.participation_role,
  role_other_ar    text,
  role_other_fr    text,
  source_url       text,
  author_editor_id uuid not null references public.editors(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,

  constraint past_participation_slug_key unique (slug),
  constraint past_participation_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint past_participation_event_end_date_check check (
    event_end_date is null or event_date is null or event_end_date >= event_date
  )
);

create index if not exists past_participation_status_idx
  on public.past_participation (status);
create index if not exists past_participation_event_date_idx
  on public.past_participation (event_date desc);
create index if not exists past_participation_author_editor_id_idx
  on public.past_participation (author_editor_id);

drop trigger if exists past_participation_touch_updated_at on public.past_participation;
create trigger past_participation_touch_updated_at
  before update on public.past_participation
  for each row execute function public.touch_updated_at();

create or replace function public.past_participation_prevent_bypass_publish()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'published' then
    raise exception 'Published Past Participation records are immutable.'
      using errcode = '23514';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''past_participation'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''past_participation'', <id>) to publish a Content Item.'
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
    if coalesce(btrim(new.event_date_label), '') = '' then
      raise exception 'Cannot publish: event date label is empty.' using errcode = '23514';
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

drop trigger if exists past_participation_prevent_bypass_publish on public.past_participation;
create trigger past_participation_prevent_bypass_publish
  before insert or update on public.past_participation
  for each row execute function public.past_participation_prevent_bypass_publish();

-- Fixed branches make the type/column mapping auditable and avoid interpolating
-- untrusted identifiers into the publish RPC.
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
      from public.position_held where id = item_id;
  elsif item_type = 'education_entry' then
    select status, degree_ar, degree_fr, honours_ar, honours_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.education_entry where id = item_id;
  elsif item_type = 'past_participation' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.past_participation where id = item_id;
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
  else
    update public.past_participation
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;
grant usage on type public.participation_role to anon, authenticated;

alter table public.past_participation enable row level security;

grant select on public.past_participation to anon;
grant select, insert, update, delete on public.past_participation to authenticated;

drop policy if exists past_participation_anon_select_published on public.past_participation;
create policy past_participation_anon_select_published
  on public.past_participation
  for select to anon
  using (status = 'published');

drop policy if exists past_participation_authenticated_select_own on public.past_participation;
create policy past_participation_authenticated_select_own
  on public.past_participation
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

drop policy if exists past_participation_authenticated_insert_own on public.past_participation;
create policy past_participation_authenticated_insert_own
  on public.past_participation
  for insert to authenticated
  with check (author_editor_id = public.current_editor_id());

drop policy if exists past_participation_authenticated_update_own on public.past_participation;
create policy past_participation_authenticated_update_own
  on public.past_participation
  for update to authenticated
  using (author_editor_id = public.current_editor_id())
  with check (author_editor_id = public.current_editor_id());

drop policy if exists past_participation_authenticated_delete_own on public.past_participation;
create policy past_participation_authenticated_delete_own
  on public.past_participation
  for delete to authenticated
  using (author_editor_id = public.current_editor_id());

create or replace function public.request_past_participation_profile_rebuild()
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
          'content_item', 'past_participation',
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

revoke execute on function public.request_past_participation_profile_rebuild() from public;

drop trigger if exists past_participation_publish_netlify_rebuild on public.past_participation;
create trigger past_participation_publish_netlify_rebuild
  after update of status on public.past_participation
  for each row
  when (old.status = 'draft' and new.status = 'published')
  execute function public.request_past_participation_profile_rebuild();

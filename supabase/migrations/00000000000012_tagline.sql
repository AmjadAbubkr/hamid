-- Tagline: the one short, paired Locale sentence used by the assembled About
-- page. This is deliberately not a free-text Bio Content Item.
--
-- A safe empty Draft is seeded during migration, before an Editor may exist.
-- The verified Portal route claims that row for the first Editor; the owner is
-- then immutable and the row can never be deleted or duplicated.

create table if not exists public.tagline (
  id                uuid primary key default gen_random_uuid(),
  singleton_key     boolean not null default true,
  status            public.content_item_status not null default 'draft',
  tagline_ar        text not null default '',
  tagline_fr        text not null default '',
  author_editor_id  uuid references public.editors(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz,

  constraint tagline_singleton_key_check check (singleton_key),
  constraint tagline_singleton_key_unique unique (singleton_key),
  constraint tagline_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create index if not exists tagline_status_idx on public.tagline (status);
create index if not exists tagline_author_editor_id_idx
  on public.tagline (author_editor_id);

-- The seed is safe to deploy before the first Editor has been bootstrapped: it
-- is a private Draft, contains no text, and cannot be published without an
-- owner. The singleton unique constraint makes rerunning the migration a no-op.
insert into public.tagline (singleton_key, status, tagline_ar, tagline_fr)
values (true, 'draft', '', '')
on conflict (singleton_key) do nothing;

drop trigger if exists tagline_touch_updated_at on public.tagline;
create trigger tagline_touch_updated_at
  before update on public.tagline
  for each row execute function public.touch_updated_at();

-- This table intentionally has no delete operation. Keeping this trigger in
-- the database (rather than relying on UI convention) is what preserves the
-- singleton guarantee after the initial seed has been created.
create or replace function public.tagline_prevent_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'The singleton Tagline cannot be deleted.' using errcode = '23514';
end;
$$;

drop trigger if exists tagline_prevent_delete on public.tagline;
create trigger tagline_prevent_delete
  before delete on public.tagline
  for each row execute function public.tagline_prevent_delete();

-- The first verified Portal update claims the seed by setting
-- author_editor_id. From then onwards an Editor cannot transfer ownership or
-- bypass the bilingual publication rule. Returning to Draft is allowed so an
-- Editor can revise one Locale without exposing an asymmetric public Tagline.
create or replace function public.tagline_prevent_bypass_publish()
returns trigger
language plpgsql
as $$
begin
  if new.singleton_key <> true then
    raise exception 'The singleton Tagline key must remain true.' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
     and old.author_editor_id is not null
     and new.author_editor_id is distinct from old.author_editor_id then
    raise exception 'Tagline ownership cannot be transferred.' using errcode = '23514';
  end if;

  if new.status = 'published' then
    if new.author_editor_id is null then
      raise exception 'Cannot publish: the Tagline has no Editor owner.' using errcode = '23514';
    end if;

    if tg_op = 'INSERT'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''tagline'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''tagline'', <id>) to publish a Content Item.'
        using errcode = '23514';
    end if;

    perform public.validate_content_item_publish(
      new.status,
      new.tagline_ar,
      new.tagline_fr,
      null,
      null,
      new.published_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tagline_prevent_bypass_publish on public.tagline;
create trigger tagline_prevent_bypass_publish
  before insert or update on public.tagline
  for each row execute function public.tagline_prevent_bypass_publish();

-- Fixed branches keep the type/column mapping auditable and never interpolate
-- caller-controlled identifiers into the publication RPC.
create or replace function public.publish_content_item(
  item_type text,
  item_id   uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  title_ar_value         text;
  title_fr_value         text;
  body_ar_value          text;
  body_fr_value          text;
  current_status         public.content_item_status;
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
  elsif item_type = 'article' then
    select status, title_ar, title_fr, body_ar, body_fr, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.article where id = item_id;
  elsif item_type = 'gallery_photo' then
    select status, caption_ar, caption_fr, null, null, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.gallery_photo where id = item_id;
  elsif item_type = 'tagline' then
    select status, tagline_ar, tagline_fr, null, null, author_editor_id
      into current_status, title_ar_value, title_fr_value, body_ar_value, body_fr_value, author_editor_id_value
      from public.tagline where id = item_id;
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
  elsif item_type = 'upcoming_event' then
    update public.upcoming_event
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  elsif item_type = 'article' then
    update public.article
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  elsif item_type = 'gallery_photo' then
    update public.gallery_photo
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  else
    update public.tagline
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

alter table public.tagline enable row level security;

-- Visitors receive only the published public sentence. The seed and any Draft
-- remain private, while all writes go through the verified Portal route so it
-- can safely claim the seed once and preserve author ownership.
revoke all on public.tagline from anon, authenticated;
grant select on public.tagline to anon, authenticated;

drop policy if exists tagline_anon_select_published on public.tagline;
create policy tagline_anon_select_published
  on public.tagline
  for select to anon
  using (status = 'published');

drop policy if exists tagline_authenticated_select_own on public.tagline;
create policy tagline_authenticated_select_own
  on public.tagline
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

-- Build requests are best-effort: local PGlite and hosted projects that have
-- not configured Vault or pg_net simply continue without a remote request.
create or replace function public.request_tagline_profile_rebuild()
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
          'content_item', 'tagline',
          'action', case when new.status = 'published'
            then 'published_or_updated' else 'unpublished' end,
          'id', new.id,
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

revoke execute on function public.request_tagline_profile_rebuild() from public;

drop trigger if exists tagline_publish_netlify_rebuild on public.tagline;
create trigger tagline_publish_netlify_rebuild
  after update on public.tagline
  for each row
  when (new.status = 'published' or old.status = 'published')
  execute function public.request_tagline_profile_rebuild();

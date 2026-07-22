-- Article: long-form, site-original writing with Arabic and French HTML bodies.
-- Body HTML is sanitized by the verified server write route before it reaches
-- this table; publication additionally requires both Locale variants.

create table if not exists public.article (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null,
  status                public.content_item_status not null default 'draft',
  title_ar              text not null default '',
  title_fr              text not null default '',
  body_ar               text not null default '',
  body_fr               text not null default '',
  published_in_url      text,
  published_in_name_ar  text,
  published_in_name_fr  text,
  published_date        date,
  author_editor_id      uuid not null references public.editors(id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  published_at          timestamptz,

  constraint article_slug_key unique (slug),
  constraint article_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint article_published_in_url_check check (
    published_in_url is null
    or published_in_url ~* '^https?://[^[:space:]]+$'
  )
);

create index if not exists article_status_idx on public.article (status);
create index if not exists article_published_date_idx
  on public.article (published_date desc);
create index if not exists article_author_editor_id_idx
  on public.article (author_editor_id);

drop trigger if exists article_touch_updated_at on public.article;
create trigger article_touch_updated_at
  before update on public.article
  for each row execute function public.touch_updated_at();

-- A publication name is editorial content, so it follows the project's paired
-- Locale rule even though the outbound URL itself is language-neutral.
create or replace function public.validate_article_publication_metadata(
  published_in_url_in     text,
  published_in_name_ar_in text,
  published_in_name_fr_in text
) returns void
language plpgsql
as $$
begin
  if coalesce(btrim(published_in_name_ar_in), '') <> ''
     and coalesce(btrim(published_in_name_fr_in), '') = '' then
    raise exception 'Cannot publish: French publication name is empty.'
      using errcode = '23514';
  end if;
  if coalesce(btrim(published_in_name_fr_in), '') <> ''
     and coalesce(btrim(published_in_name_ar_in), '') = '' then
    raise exception 'Cannot publish: Arabic publication name is empty.'
      using errcode = '23514';
  end if;
  if published_in_url_in is not null
     and published_in_url_in !~* '^https?://[^[:space:]]+$' then
    raise exception 'Cannot publish: published-in URL must be an HTTP(S) URL.'
      using errcode = '23514';
  end if;
end;
$$;

-- Draft-to-published transitions are trusted only when they originate inside
-- publish_content_item(). Published Articles stay editable through the verified
-- server route, but every update is revalidated before a rebuild is requested.
create or replace function public.article_prevent_bypass_publish()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    raise exception 'Published Articles cannot return to draft.'
      using errcode = '23514';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''article'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''article'', <id>) to publish a Content Item.'
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

    if coalesce(btrim(new.body_ar), '') = '' then
      raise exception 'Cannot publish: Arabic body is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.body_fr), '') = '' then
      raise exception 'Cannot publish: French body is empty.' using errcode = '23514';
    end if;
    if new.published_date is null then
      raise exception 'Cannot publish: original publication date is empty.' using errcode = '23514';
    end if;

    perform public.validate_article_publication_metadata(
      new.published_in_url,
      new.published_in_name_ar,
      new.published_in_name_fr
    );
  end if;

  return new;
end;
$$;

drop trigger if exists article_prevent_bypass_publish on public.article;
create trigger article_prevent_bypass_publish
  before insert or update on public.article
  for each row execute function public.article_prevent_bypass_publish();

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
  else
    update public.article
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

alter table public.article enable row level security;

-- Browser clients can read published Articles and their own rows only. All
-- mutations deliberately go through a verified server route with service role.
revoke all on public.article from anon, authenticated;
grant select on public.article to anon, authenticated;

drop policy if exists article_anon_select_published on public.article;
create policy article_anon_select_published
  on public.article
  for select to anon
  using (status = 'published');

drop policy if exists article_authenticated_select_own on public.article;
create policy article_authenticated_select_own
  on public.article
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

-- Build requests are best-effort: local PGlite and projects without Vault or
-- pg_net configured simply continue without a remote request.
create or replace function public.request_article_profile_rebuild()
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
          'content_item', 'article',
          'action', 'published_or_updated',
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

revoke execute on function public.request_article_profile_rebuild() from public;

drop trigger if exists article_publish_netlify_rebuild on public.article;
create trigger article_publish_netlify_rebuild
  after update on public.article
  for each row
  when (new.status = 'published')
  execute function public.request_article_profile_rebuild();

create or replace function public.request_article_deletion_profile_rebuild()
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
          'content_item', 'article',
          'action', 'deleted',
          'id', old.id,
          'slug', old.slug,
          'published_at', old.published_at
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

revoke execute on function public.request_article_deletion_profile_rebuild() from public;

drop trigger if exists article_delete_netlify_rebuild on public.article;
create trigger article_delete_netlify_rebuild
  after delete on public.article
  for each row
  when (old.status = 'published')
  execute function public.request_article_deletion_profile_rebuild();

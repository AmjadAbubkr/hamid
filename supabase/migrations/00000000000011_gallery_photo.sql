-- Gallery Photo: image bytes stay in Supabase Storage. This table persists
-- only the storage-object key, never a binary payload. Moving an object between
-- the private staging bucket and public bucket is deliberately performed by the
-- verified application route because Storage object copies are not SQL actions.

create table if not exists public.gallery_photo (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null,
  status                   public.content_item_status not null default 'draft',
  storage_path             text not null default '',
  caption_ar               text not null default '',
  caption_fr               text not null default '',
  taken_date               date,
  photographer_credit_ar   text,
  photographer_credit_fr   text,
  category_ar              text,
  category_fr              text,
  author_editor_id         uuid not null references public.editors(id) on delete restrict,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  published_at             timestamptz,

  constraint gallery_photo_slug_key unique (slug),
  constraint gallery_photo_status_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint gallery_photo_storage_path_check check (
    storage_path = ''
    or storage_path !~ '(^/|(^|/)\.\.(/|$))'
  )
);

create index if not exists gallery_photo_status_idx
  on public.gallery_photo (status);
create index if not exists gallery_photo_taken_date_idx
  on public.gallery_photo (taken_date desc);
create index if not exists gallery_photo_author_editor_id_idx
  on public.gallery_photo (author_editor_id);

drop trigger if exists gallery_photo_touch_updated_at on public.gallery_photo;
create trigger gallery_photo_touch_updated_at
  before update on public.gallery_photo
  for each row execute function public.touch_updated_at();

-- Publication is possible only after the application has copied the validated
-- image to gallery-public. Returning a photo to draft is allowed so the same
-- route can first copy it back to gallery-staging and remove the public object.
create or replace function public.gallery_photo_prevent_bypass_publish()
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
      raise exception 'Direct publication is forbidden. Call publish_content_item(''gallery_photo'', <id>) to publish a Content Item.'
        using errcode = '23514';
    elsif tg_op = 'UPDATE' and old.status <> 'published'
       and current_user <> (
         select pg_get_userbyid(proowner)
         from pg_proc
         where oid = 'public.publish_content_item(text,uuid)'::regprocedure
       ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''gallery_photo'', <id>) to publish a Content Item.'
        using errcode = '23514';
    end if;

    perform public.validate_content_item_publish(
      new.status,
      new.caption_ar,
      new.caption_fr,
      null,
      null,
      new.published_at
    );

    if coalesce(btrim(new.storage_path), '') = '' then
      raise exception 'Cannot publish: gallery image is empty.' using errcode = '23514';
    end if;
    if new.taken_date is null then
      raise exception 'Cannot publish: taken date is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.photographer_credit_ar), '') <> ''
       and coalesce(btrim(new.photographer_credit_fr), '') = '' then
      raise exception 'Cannot publish: French photographer credit is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.photographer_credit_fr), '') <> ''
       and coalesce(btrim(new.photographer_credit_ar), '') = '' then
      raise exception 'Cannot publish: Arabic photographer credit is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.category_ar), '') <> ''
       and coalesce(btrim(new.category_fr), '') = '' then
      raise exception 'Cannot publish: French category is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.category_fr), '') <> ''
       and coalesce(btrim(new.category_ar), '') = '' then
      raise exception 'Cannot publish: Arabic category is empty.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists gallery_photo_prevent_bypass_publish on public.gallery_photo;
create trigger gallery_photo_prevent_bypass_publish
  before insert or update on public.gallery_photo
  for each row execute function public.gallery_photo_prevent_bypass_publish();

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
  else
    update public.gallery_photo
      set status = 'published', published_at = now()
      where id = item_id and status <> 'published';
  end if;
end;
$$;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

alter table public.gallery_photo enable row level security;

-- The browser can see a published image's metadata or its own drafts. A
-- verified server route owns every table mutation, ensuring metadata changes
-- cannot leave an image in the wrong Storage bucket.
revoke all on public.gallery_photo from anon, authenticated;
grant select on public.gallery_photo to anon, authenticated;

drop policy if exists gallery_photo_anon_select_published on public.gallery_photo;
create policy gallery_photo_anon_select_published
  on public.gallery_photo
  for select to anon
  using (status = 'published');

drop policy if exists gallery_photo_authenticated_select_own on public.gallery_photo;
create policy gallery_photo_authenticated_select_own
  on public.gallery_photo
  for select to authenticated
  using (author_editor_id = public.current_editor_id());

-- Hosted Supabase has the storage schema. Dynamic statements keep this
-- migration executable in the PGlite schema tests, where Storage is absent.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then

  execute $storage$
    insert into storage.buckets (
      id, name, public, file_size_limit, allowed_mime_types
    ) values
      ('gallery-staging', 'gallery-staging', false, 8388608,
       array['image/jpeg', 'image/png', 'image/webp']::text[]),
      ('gallery-public', 'gallery-public', true, 8388608,
       array['image/jpeg', 'image/png', 'image/webp']::text[])
    on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types
  $storage$;

  execute 'grant select on storage.objects to anon';
  execute 'grant select, insert, update, delete on storage.objects to authenticated';

  execute 'drop policy if exists gallery_public_read on storage.objects';
  execute $policy$
    create policy gallery_public_read
      on storage.objects for select to anon, authenticated
      using (bucket_id = 'gallery-public')
  $policy$;

  execute 'drop policy if exists gallery_staging_editor_read on storage.objects';
  execute $policy$
    create policy gallery_staging_editor_read
      on storage.objects for select to authenticated
      using (
        bucket_id = 'gallery-staging'
        and (storage.foldername(name))[1] = public.current_editor_id()::text
      )
  $policy$;

  execute 'drop policy if exists gallery_editor_write on storage.objects';
  execute $policy$
    create policy gallery_editor_write
      on storage.objects for insert to authenticated
      with check (
        bucket_id in ('gallery-staging', 'gallery-public')
        and (storage.foldername(name))[1] = public.current_editor_id()::text
      )
  $policy$;

  execute 'drop policy if exists gallery_editor_update on storage.objects';
  execute $policy$
    create policy gallery_editor_update
      on storage.objects for update to authenticated
      using (
        bucket_id in ('gallery-staging', 'gallery-public')
        and (storage.foldername(name))[1] = public.current_editor_id()::text
      )
      with check (
        bucket_id in ('gallery-staging', 'gallery-public')
        and (storage.foldername(name))[1] = public.current_editor_id()::text
      )
  $policy$;

  execute 'drop policy if exists gallery_editor_delete on storage.objects';
  execute $policy$
    create policy gallery_editor_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id in ('gallery-staging', 'gallery-public')
        and (storage.foldername(name))[1] = public.current_editor_id()::text
      )
  $policy$;
  end if;
exception
  when invalid_schema_name or undefined_table or undefined_function then
    null;
end;
$$;

-- Build requests are best-effort: local PGlite and hosted projects that have
-- not configured Vault or pg_net simply continue without a remote request.
create or replace function public.request_gallery_photo_profile_rebuild()
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
          'content_item', 'gallery_photo',
          'action', case when new.status = 'published'
            then 'published_or_updated' else 'unpublished' end,
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

revoke execute on function public.request_gallery_photo_profile_rebuild() from public;

drop trigger if exists gallery_photo_publish_netlify_rebuild on public.gallery_photo;
create trigger gallery_photo_publish_netlify_rebuild
  after update on public.gallery_photo
  for each row
  when (new.status = 'published' or old.status = 'published')
  execute function public.request_gallery_photo_profile_rebuild();

create or replace function public.request_gallery_photo_deletion_profile_rebuild()
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
          'content_item', 'gallery_photo',
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

revoke execute on function public.request_gallery_photo_deletion_profile_rebuild() from public;

drop trigger if exists gallery_photo_delete_netlify_rebuild on public.gallery_photo;
create trigger gallery_photo_delete_netlify_rebuild
  after delete on public.gallery_photo
  for each row
  when (old.status = 'published')
  execute function public.request_gallery_photo_deletion_profile_rebuild();

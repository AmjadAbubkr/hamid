-- Articles may be published in one complete language. The other language
-- fields remain optional, but a partially entered language is not valid.
create or replace function public.validate_article_publish(
  title_ar_in text, title_fr_in text, title_en_in text,
  body_ar_in text, body_fr_in text, body_en_in text
) returns void language plpgsql as $$
declare
  complete_count integer := 0;
begin
  if (coalesce(btrim(title_ar_in), '') = '') <> (coalesce(btrim(body_ar_in), '') = '')
     or (coalesce(btrim(title_fr_in), '') = '') <> (coalesce(btrim(body_fr_in), '') = '')
     or (coalesce(btrim(title_en_in), '') = '') <> (coalesce(btrim(body_en_in), '') = '') then
    raise exception 'Cannot publish: complete the title and body for each language you start.' using errcode = '23514';
  end if;
  if coalesce(btrim(title_ar_in), '') <> '' then complete_count := complete_count + 1; end if;
  if coalesce(btrim(title_fr_in), '') <> '' then complete_count := complete_count + 1; end if;
  if coalesce(btrim(title_en_in), '') <> '' then complete_count := complete_count + 1; end if;
  if complete_count = 0 then
    raise exception 'Cannot publish: add a title and body in Arabic, French, or English.' using errcode = '23514';
  end if;
end;
$$;

create or replace function public.validate_article_publication_metadata(
  published_in_url_in text, published_in_name_ar_in text, published_in_name_fr_in text, published_in_name_en_in text default null
) returns void language plpgsql as $$
begin
  if coalesce(btrim(published_in_name_ar_in), '') <> ''
     and (coalesce(btrim(published_in_name_fr_in), '') = '' or coalesce(btrim(published_in_name_en_in), '') = '') then
    raise exception 'Cannot publish: French or English publication name is empty.' using errcode = '23514';
  end if;
  if coalesce(btrim(published_in_name_fr_in), '') <> ''
     and (coalesce(btrim(published_in_name_ar_in), '') = '' or coalesce(btrim(published_in_name_en_in), '') = '') then
    raise exception 'Cannot publish: Arabic or English publication name is empty.' using errcode = '23514';
  end if;
  if coalesce(btrim(published_in_name_en_in), '') <> ''
     and (coalesce(btrim(published_in_name_ar_in), '') = '' or coalesce(btrim(published_in_name_fr_in), '') = '') then
    raise exception 'Cannot publish: Arabic or French publication name is empty.' using errcode = '23514';
  end if;
  if published_in_url_in is not null and published_in_url_in !~* '^https?://[^[:space:]]+$' then
    raise exception 'Cannot publish: published-in URL must be an HTTP(S) URL.' using errcode = '23514';
  end if;
end;
$$;

create or replace function public.article_prevent_bypass_publish()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    raise exception 'Published Articles cannot return to draft.' using errcode = '23514';
  end if;
  if new.status = 'published' then
    if (tg_op = 'INSERT' or old.status <> 'published') and current_user <> (
      select pg_get_userbyid(proowner) from pg_proc where oid = 'public.publish_content_item(text,uuid)'::regprocedure
    ) then
      raise exception 'Direct publication is forbidden. Call publish_content_item(''article'', <id>) to publish a Content Item.' using errcode = '23514';
    end if;
    perform public.validate_article_publish(new.title_ar, new.title_fr, new.title_en, new.body_ar, new.body_fr, new.body_en);
    if new.published_date is null then raise exception 'Cannot publish: original publication date is empty.' using errcode = '23514'; end if;
    perform public.validate_article_publication_metadata(new.published_in_url, new.published_in_name_ar, new.published_in_name_fr, new.published_in_name_en);
  end if;
  return new;
end;
$$;

-- The current publish function first calls the shared all-language validator.
-- For Articles the trigger above is now the dedicated one-language gate.
create or replace function public.publish_content_item(item_type text, item_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare title_ar_value text; title_fr_value text; title_en_value text; body_ar_value text; body_fr_value text; body_en_value text; current_status public.content_item_status; author_editor_id_value uuid;
begin
  if item_type is null or item_id is null then raise exception 'publish_content_item requires a non-null item_type and item_id.' using errcode = '22023'; end if;
  if item_type = 'position_held' then select status,title_ar,title_fr,title_en,body_ar,body_fr,body_en,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from position_held where id=item_id;
  elsif item_type = 'education_entry' then select status,degree_ar,degree_fr,degree_en,honours_ar,honours_fr,honours_en,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from education_entry where id=item_id;
  elsif item_type = 'past_participation' then select status,title_ar,title_fr,title_en,body_ar,body_fr,body_en,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from past_participation where id=item_id;
  elsif item_type = 'upcoming_event' then select status,title_ar,title_fr,title_en,body_ar,body_fr,body_en,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from upcoming_event where id=item_id;
  elsif item_type = 'article' then select status,title_ar,title_fr,title_en,body_ar,body_fr,body_en,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from article where id=item_id;
  elsif item_type = 'gallery_photo' then select status,caption_ar,caption_fr,caption_en,null,null,null,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from gallery_photo where id=item_id;
  elsif item_type = 'tagline' then select status,tagline_ar,tagline_fr,tagline_en,null,null,null,author_editor_id into current_status,title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,author_editor_id_value from tagline where id=item_id;
  else raise exception 'Unknown Content Item type ''%''', item_type using errcode='22023'; end if;
  if current_status is null then raise exception 'Content Item of type ''%'' with id % not found.',item_type,item_id using errcode='23503'; end if;
  if not exists (select 1 from editors where id=author_editor_id_value and auth_user_id=auth.uid()) then raise exception 'Not authorized to publish this Content Item.' using errcode='42501'; end if;
  if item_type = 'article' then perform public.validate_article_publish(title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value); else perform public.validate_content_item_publish('published',title_ar_value,title_fr_value,title_en_value,body_ar_value,body_fr_value,body_en_value,now()); end if;
  if item_type='position_held' then update position_held set status='published',published_at=now() where id=item_id and status<>'published';
  elsif item_type='education_entry' then update education_entry set status='published',published_at=now() where id=item_id and status<>'published';
  elsif item_type='past_participation' then update past_participation set status='published',published_at=now() where id=item_id and status<>'published';
  elsif item_type='upcoming_event' then update upcoming_event set status='published',published_at=now() where id=item_id and status<>'published';
  elsif item_type='article' then update article set status='published',published_at=now() where id=item_id and status<>'published';
  elsif item_type='gallery_photo' then update gallery_photo set status='published',published_at=now() where id=item_id and status<>'published';
  else update tagline set status='published',published_at=now() where id=item_id and status<>'published'; end if;
end;
$$;

alter table public.upcoming_event add column if not exists image_path text;
alter table public.past_participation add column if not exists image_path text;

-- PGlite schema tests intentionally do not emulate Supabase Storage. Hosted
-- Supabase does, so create the buckets and policies only when it is present.
do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('content-staging', 'content-staging', false, 8388608, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('content-public', 'content-public', true, 8388608, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
  execute 'create policy "content_public_read" on storage.objects for select to public using (bucket_id = ''content-public'')';
  execute 'create policy "content_editor_staging_read" on storage.objects for select to authenticated using (bucket_id = ''content-staging'' and (storage.foldername(name))[1] = public.current_editor_id()::text)';
  execute 'create policy "content_editor_write" on storage.objects for insert to authenticated with check (bucket_id in (''content-staging'',''content-public'') and (storage.foldername(name))[1] = public.current_editor_id()::text)';
  execute 'create policy "content_editor_update" on storage.objects for update to authenticated using (bucket_id in (''content-staging'',''content-public'') and (storage.foldername(name))[1] = public.current_editor_id()::text)';
  execute 'create policy "content_editor_delete" on storage.objects for delete to authenticated using (bucket_id in (''content-staging'',''content-public'') and (storage.foldername(name))[1] = public.current_editor_id()::text)';
end;
$$;

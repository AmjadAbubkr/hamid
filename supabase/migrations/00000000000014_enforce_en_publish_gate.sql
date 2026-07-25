-- Migration 014: widen the symmetric-publish gate to require English (_en)
-- alongside Arabic (_ar) and French (_fr) for all Content Item publications.
--
-- Supersedes ADR-0007's bilingual gate per ADR-0011.
-- Must be applied _after_ migration 013 has added the _en columns.
-- After this migration, every publish attempt on any Content Item table will
-- fail unless the English title (and paired body, where applicable) is filled.

-- 1. Shared gate function — now requires English title and 3-locale body pairing.

create or replace function public.validate_content_item_publish(
  status_in            public.content_item_status,
  title_ar_in          text,
  title_fr_in          text,
  title_en_in          text,
  body_ar_in           text,
  body_fr_in           text,
  body_en_in           text,
  new_published_at_in  timestamptz
) returns void
language plpgsql
as $$
begin
  if status_in = 'published' then
    if coalesce(btrim(title_ar_in), '') = '' then
      raise exception 'Cannot publish: Arabic title is empty. Use publish_content_item() and fill all three Locales.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(title_fr_in), '') = '' then
      raise exception 'Cannot publish: French title is empty. Use publish_content_item() and fill all three Locales.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(title_en_in), '') = '' then
      raise exception 'Cannot publish: English title is empty. Use publish_content_item() and fill all three Locales.'
        using errcode = '23514';
    end if;

    if coalesce(btrim(body_ar_in), '') = ''
       and (coalesce(btrim(body_fr_in), '') <> '' or coalesce(btrim(body_en_in), '') <> '') then
      raise exception 'Cannot publish: Arabic body is empty. Fill all three Locales or leave the optional body empty.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(body_fr_in), '') = ''
       and (coalesce(btrim(body_ar_in), '') <> '' or coalesce(btrim(body_en_in), '') <> '') then
      raise exception 'Cannot publish: French body is empty. Fill all three Locales or leave the optional body empty.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(body_en_in), '') = ''
       and (coalesce(btrim(body_ar_in), '') <> '' or coalesce(btrim(body_fr_in), '') <> '') then
      raise exception 'Cannot publish: English body is empty. Fill all three Locales or leave the optional body empty.'
        using errcode = '23514';
    end if;

    if new_published_at_in is null then
      raise exception 'Cannot publish: published_at must be set when status = ''published''.'
        using errcode = '23514';
    end if;
  end if;
end;
$$;

-- 2. Per-table publish-gate triggers — pass _en columns to the shared validator.

-- 2a. position_held

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
      new.status, new.title_ar, new.title_fr, new.title_en,
      new.body_ar, new.body_fr, new.body_en,
      new.published_at
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

-- 2b. education_entry

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

    perform public.validate_content_item_publish(
      new.status,
      new.degree_ar, new.degree_fr, new.degree_en,
      new.honours_ar, new.honours_fr, new.honours_en,
      new.published_at
    );

    if coalesce(btrim(new.institution_ar), '') = '' then
      raise exception 'Cannot publish: Arabic institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_fr), '') = '' then
      raise exception 'Cannot publish: French institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_en), '') = '' then
      raise exception 'Cannot publish: English institution is empty.' using errcode = '23514';
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

-- 2c. past_participation

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
      new.status, new.title_ar, new.title_fr, new.title_en,
      new.body_ar, new.body_fr, new.body_en,
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
    if coalesce(btrim(new.venue_en), '') = '' then
      raise exception 'Cannot publish: English venue is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_ar), '') = '' then
      raise exception 'Cannot publish: Arabic institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_fr), '') = '' then
      raise exception 'Cannot publish: French institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_en), '') = '' then
      raise exception 'Cannot publish: English institution is empty.' using errcode = '23514';
    end if;
    if new.role is null then
      raise exception 'Cannot publish: role is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_ar), '') <> ''
       and (coalesce(btrim(new.role_other_fr), '') = '' or coalesce(btrim(new.role_other_en), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_fr), '') <> ''
       and (coalesce(btrim(new.role_other_ar), '') = '' or coalesce(btrim(new.role_other_en), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_en), '') <> ''
       and (coalesce(btrim(new.role_other_ar), '') = '' or coalesce(btrim(new.role_other_fr), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if new.role = 'Other'
       and (
         coalesce(btrim(new.role_other_ar), '') = ''
         or coalesce(btrim(new.role_other_fr), '') = ''
         or coalesce(btrim(new.role_other_en), '') = ''
       ) then
      raise exception 'Cannot publish: all three Locales of the other role are required when role is Other.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- 2d. upcoming_event

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
      new.status, new.title_ar, new.title_fr, new.title_en,
      new.body_ar, new.body_fr, new.body_en,
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
    if coalesce(btrim(new.venue_en), '') = '' then
      raise exception 'Cannot publish: English venue is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_ar), '') = '' then
      raise exception 'Cannot publish: Arabic institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_fr), '') = '' then
      raise exception 'Cannot publish: French institution is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.institution_en), '') = '' then
      raise exception 'Cannot publish: English institution is empty.' using errcode = '23514';
    end if;
    if new.role is null then
      raise exception 'Cannot publish: role is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_ar), '') <> ''
       and (coalesce(btrim(new.role_other_fr), '') = '' or coalesce(btrim(new.role_other_en), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_fr), '') <> ''
       and (coalesce(btrim(new.role_other_ar), '') = '' or coalesce(btrim(new.role_other_en), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.role_other_en), '') <> ''
       and (coalesce(btrim(new.role_other_ar), '') = '' or coalesce(btrim(new.role_other_fr), '') = '') then
      raise exception 'Cannot publish: all Locales of the other role are required when one is filled.'
        using errcode = '23514';
    end if;
    if new.role = 'Other'
       and (
         coalesce(btrim(new.role_other_ar), '') = ''
         or coalesce(btrim(new.role_other_fr), '') = ''
         or coalesce(btrim(new.role_other_en), '') = ''
       ) then
      raise exception 'Cannot publish: all three Locales of the other role are required when role is Other.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- 2e. article

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
      new.status, new.title_ar, new.title_fr, new.title_en,
      new.body_ar, new.body_fr, new.body_en,
      new.published_at
    );

    if coalesce(btrim(new.body_ar), '') = '' then
      raise exception 'Cannot publish: Arabic body is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.body_fr), '') = '' then
      raise exception 'Cannot publish: French body is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.body_en), '') = '' then
      raise exception 'Cannot publish: English body is empty.' using errcode = '23514';
    end if;
    if new.published_date is null then
      raise exception 'Cannot publish: original publication date is empty.' using errcode = '23514';
    end if;

    perform public.validate_article_publication_metadata(
      new.published_in_url,
      new.published_in_name_ar,
      new.published_in_name_fr,
      new.published_in_name_en
    );
  end if;

  return new;
end;
$$;

-- 2f. gallery_photo

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
      new.caption_ar, new.caption_fr, new.caption_en,
      null, null, null,
      new.published_at
    );

    if coalesce(btrim(new.storage_path), '') = '' then
      raise exception 'Cannot publish: gallery image is empty.' using errcode = '23514';
    end if;
    if new.taken_date is null then
      raise exception 'Cannot publish: taken date is empty.' using errcode = '23514';
    end if;
    if coalesce(btrim(new.photographer_credit_ar), '') <> ''
       and (coalesce(btrim(new.photographer_credit_fr), '') = '' or coalesce(btrim(new.photographer_credit_en), '') = '') then
      raise exception 'Cannot publish: all Locales of photographer credit are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.photographer_credit_fr), '') <> ''
       and (coalesce(btrim(new.photographer_credit_ar), '') = '' or coalesce(btrim(new.photographer_credit_en), '') = '') then
      raise exception 'Cannot publish: all Locales of photographer credit are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.photographer_credit_en), '') <> ''
       and (coalesce(btrim(new.photographer_credit_ar), '') = '' or coalesce(btrim(new.photographer_credit_fr), '') = '') then
      raise exception 'Cannot publish: all Locales of photographer credit are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.category_ar), '') <> ''
       and (coalesce(btrim(new.category_fr), '') = '' or coalesce(btrim(new.category_en), '') = '') then
      raise exception 'Cannot publish: all Locales of category are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.category_fr), '') <> ''
       and (coalesce(btrim(new.category_ar), '') = '' or coalesce(btrim(new.category_en), '') = '') then
      raise exception 'Cannot publish: all Locales of category are required when one is filled.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(new.category_en), '') <> ''
       and (coalesce(btrim(new.category_ar), '') = '' or coalesce(btrim(new.category_fr), '') = '') then
      raise exception 'Cannot publish: all Locales of category are required when one is filled.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- 2g. tagline

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
      new.tagline_ar, new.tagline_fr, new.tagline_en,
      null, null, null,
      new.published_at
    );
  end if;

  return new;
end;
$$;

-- 3. publish_content_item — widened SELECT lists and validate call.

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
  title_en_value         text;
  body_ar_value          text;
  body_fr_value          text;
  body_en_value          text;
  current_status         public.content_item_status;
  author_editor_id_value uuid;
begin
  if item_type is null or item_id is null then
    raise exception 'publish_content_item requires a non-null item_type and item_id.'
      using errcode = '22023';
  end if;

  if item_type = 'position_held' then
    select status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.position_held where id = item_id;
  elsif item_type = 'education_entry' then
    select status, degree_ar, degree_fr, degree_en, honours_ar, honours_fr, honours_en, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.education_entry where id = item_id;
  elsif item_type = 'past_participation' then
    select status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.past_participation where id = item_id;
  elsif item_type = 'upcoming_event' then
    select status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.upcoming_event where id = item_id;
  elsif item_type = 'article' then
    select status, title_ar, title_fr, title_en, body_ar, body_fr, body_en, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.article where id = item_id;
  elsif item_type = 'gallery_photo' then
    select status, caption_ar, caption_fr, caption_en, null, null, null, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
      from public.gallery_photo where id = item_id;
  elsif item_type = 'tagline' then
    select status, tagline_ar, tagline_fr, tagline_en, null, null, null, author_editor_id
      into current_status, title_ar_value, title_fr_value, title_en_value, body_ar_value, body_fr_value, body_en_value, author_editor_id_value
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
    'published',
    title_ar_value, title_fr_value, title_en_value,
    body_ar_value, body_fr_value, body_en_value,
    now()
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

-- 4. archive_expired_upcoming_events — carry over _en columns.

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
      id, slug, status,
      title_ar, title_fr, title_en, body_ar, body_fr, body_en,
      event_date, event_date_label,
      venue_ar, venue_fr, venue_en,
      institution_ar, institution_fr, institution_en,
      role, role_other_ar, role_other_fr, role_other_en,
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
      title_ar, title_fr, title_en, body_ar, body_fr, body_en,
      event_date, to_char(event_date, 'YYYY-MM-DD'),
      venue_ar, venue_fr, venue_en,
      institution_ar, institution_fr, institution_en,
      role, role_other_ar, role_other_fr, role_other_en,
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

-- 5. Widen the article publication-name validator to require English pairing.

create or replace function public.validate_article_publication_metadata(
  published_in_url_in     text,
  published_in_name_ar_in text,
  published_in_name_fr_in text,
  published_in_name_en_in text default null
) returns void
language plpgsql
as $$
begin
  if coalesce(btrim(published_in_name_ar_in), '') <> ''
     and (coalesce(btrim(published_in_name_fr_in), '') = '' or coalesce(btrim(published_in_name_en_in), '') = '') then
    raise exception 'Cannot publish: French or English publication name is empty.'
      using errcode = '23514';
  end if;
  if coalesce(btrim(published_in_name_fr_in), '') <> ''
     and (coalesce(btrim(published_in_name_ar_in), '') = '' or coalesce(btrim(published_in_name_en_in), '') = '') then
    raise exception 'Cannot publish: Arabic or English publication name is empty.'
      using errcode = '23514';
  end if;
  if coalesce(btrim(published_in_name_en_in), '') <> ''
     and (coalesce(btrim(published_in_name_ar_in), '') = '' or coalesce(btrim(published_in_name_fr_in), '') = '') then
    raise exception 'Cannot publish: Arabic or French publication name is empty.'
      using errcode = '23514';
  end if;
  if published_in_url_in is not null
     and published_in_url_in !~* '^https?://[^[:space:]]+$' then
    raise exception 'Cannot publish: published-in URL must be an HTTP(S) URL.'
      using errcode = '23514';
  end if;
end;
$$;

-- Update the article trigger to pass published_in_name_en.

drop trigger if exists article_prevent_bypass_publish on public.article;
create trigger article_prevent_bypass_publish
  before insert or update on public.article
  for each row execute function public.article_prevent_bypass_publish();

-- Re-grant execute on the changed functions.

revoke execute on function public.validate_content_item_publish(
  public.content_item_status, text, text, text, text, text, text, timestamptz
) from public;
grant execute on function public.validate_content_item_publish(
  public.content_item_status, text, text, text, text, text, text, timestamptz
) to authenticated;

revoke execute on function public.publish_content_item(text, uuid) from public;
grant execute on function public.publish_content_item(text, uuid) to authenticated;

-- Grant SELECT on the new _en columns is implicit since the tables already
-- grant SELECT to anon/authenticated and ALTER TABLE ADD COLUMN does not revoke.

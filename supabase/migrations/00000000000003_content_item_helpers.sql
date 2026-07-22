-- Roles used by RLS policies. In hosted Supabase these exist out-of-the-box as
-- `anon` and `authenticated`. For local pglite-based tests, we create them as
-- bare roles so RLS policies can target those same hosted roles and tests can switch
-- via `SET ROLE`.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated noinherit;
  end if;
end $$;

grant execute on function public.current_editor_id() to authenticated;

-- Publish gate function: a shared validator invoked by per-table triggers.
-- Titles are required for every Content Item. Bodies are paired when supplied,
-- but each table decides whether its body is a required field (a Position Held
-- summary is optional; an Article body will not be).

create or replace function public.validate_content_item_publish(
  status_in   public.content_item_status,
  title_ar_in text,
  title_fr_in text,
  body_ar_in text,
  body_fr_in text,
  new_published_at_in timestamptz
) returns void
language plpgsql
as $$
begin
  if status_in = 'published' then
    if coalesce(btrim(title_ar_in), '') = '' then
      raise exception 'Cannot publish: Arabic title is empty. Use publish_content_item() and fill both Locales.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(title_fr_in), '') = '' then
      raise exception 'Cannot publish: French title is empty. Use publish_content_item() and fill both Locales.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(body_ar_in), '') = ''
       and coalesce(btrim(body_fr_in), '') <> '' then
      raise exception 'Cannot publish: Arabic body is empty. Fill both Locales or leave the optional summary empty.'
        using errcode = '23514';
    end if;
    if coalesce(btrim(body_fr_in), '') = ''
       and coalesce(btrim(body_ar_in), '') <> '' then
      raise exception 'Cannot publish: French body is empty. Fill both Locales or leave the optional summary empty.'
        using errcode = '23514';
    end if;
    if new_published_at_in is null then
      raise exception 'Cannot publish: published_at must be set when status = ''published''.'
        using errcode = '23514';
    end if;
  end if;
end;
$$;

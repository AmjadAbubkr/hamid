-- Rebuild the static public Profile when a Position Held first becomes public.
--
-- Hosted setup (kept outside source control): enable the pg_net and Vault
-- extensions, then store the Netlify build-hook URL as the Vault secret named
-- `netlify_build_hook_url`. The trigger intentionally no-ops in local PGlite
-- tests and in unconfigured projects; publishing content must never expose the
-- hook URL or block on a remote HTTP request.

create or replace function public.request_position_held_profile_rebuild()
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
          'content_item', 'position_held',
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

revoke execute on function public.request_position_held_profile_rebuild() from public;

drop trigger if exists position_held_publish_netlify_rebuild on public.position_held;
create trigger position_held_publish_netlify_rebuild
  after update of status on public.position_held
  for each row
  when (old.status = 'draft' and new.status = 'published')
  execute function public.request_position_held_profile_rebuild();

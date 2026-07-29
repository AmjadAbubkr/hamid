-- Every account created in Supabase Auth is an approved Portal Editor.
-- This is an explicit product decision for this private Portal: Auth accounts
-- are created only by the site owner in the Supabase dashboard.
create or replace function public.create_editor_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.editors (auth_user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(split_part(new.email, '@', 1)), ''),
      'Portal Editor'
    )
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_editor_for_auth_user on auth.users;
create trigger create_editor_for_auth_user
  after insert on auth.users
  for each row execute function public.create_editor_for_auth_user();

-- Link accounts created before this migration as well.
insert into public.editors (auth_user_id, display_name)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(email, '@', 1)), ''),
    'Portal Editor'
  )
from auth.users
on conflict (auth_user_id) do nothing;

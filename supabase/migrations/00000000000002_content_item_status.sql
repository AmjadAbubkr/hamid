-- Content Item status enum shared by every Content Item table.
-- See CONTEXT.md Draft / Published.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'content_item_status'
  ) then
    create type public.content_item_status as enum ('draft', 'published');
  end if;
end $$;

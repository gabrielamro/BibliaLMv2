create schema if not exists private;
revoke all on schema private from public, anon;

alter table public.posts
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists dedupe_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_metadata_object_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_metadata_object_check
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

create unique index if not exists idx_posts_user_dedupe_key
  on public.posts (user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_posts_source
  on public.posts (source_type, source_id)
  where source_type is not null and source_id is not null;

create or replace function private.can_view_post(
  post_author_id uuid,
  post_visibility text,
  post_church_id uuid,
  post_cell_id uuid,
  post_also_show_on_church boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      post_author_id = (select auth.uid())
      or coalesce(post_visibility, 'public') = 'public'
      or (
        post_visibility = 'followers'
        and exists (
          select 1
          from public.follows f
          where f.follower_id = (select auth.uid())
            and f.following_id = post_author_id
        )
      )
      or (
        (post_visibility = 'church' or coalesce(post_also_show_on_church, false))
        and post_church_id is not null
        and exists (
          select 1
          from public.memberships m
          where m.user_id = (select auth.uid())
            and m.church_id = post_church_id
        )
      )
      or (
        post_visibility = 'group'
        and post_cell_id is not null
        and exists (
          select 1
          from public.memberships m
          where m.user_id = (select auth.uid())
            and m.cell_id = post_cell_id
        )
      )
    );
$$;

revoke all on function private.can_view_post(uuid, text, uuid, uuid, boolean) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.can_view_post(uuid, text, uuid, uuid, boolean) to authenticated;

drop policy if exists "Posts são públicos" on public.posts;
drop policy if exists "Usuários criam posts" on public.posts;
drop policy if exists "Usuários editam próprios posts" on public.posts;
drop policy if exists "posts_public_read" on public.posts;
drop policy if exists "posts_authenticated_read" on public.posts;
drop policy if exists "posts_owner_insert" on public.posts;
drop policy if exists "posts_owner_update" on public.posts;
drop policy if exists "posts_owner_delete" on public.posts;

create policy posts_public_read
on public.posts for select
to anon
using (coalesce(visibility, 'public') = 'public');

create policy posts_authenticated_read
on public.posts for select
to authenticated
using (
  (select private.can_view_post(
    user_id,
    visibility,
    church_id,
    cell_id,
    also_show_on_church
  ))
);

create policy posts_owner_insert
on public.posts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy posts_owner_update
on public.posts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy posts_owner_delete
on public.posts for delete
to authenticated
using ((select auth.uid()) = user_id);

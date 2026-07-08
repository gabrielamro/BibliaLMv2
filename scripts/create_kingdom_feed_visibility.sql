-- Reino: visibilidade de postagens e suporte ao feed personalizado.

alter table if exists public.posts
  add column if not exists visibility text not null default 'public';

do $$
begin
  if to_regclass('public.posts') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'posts_visibility_check'
         and conrelid = 'public.posts'::regclass
     ) then
    alter table public.posts
      add constraint posts_visibility_check
      check (visibility in ('public', 'followers', 'church', 'group', 'private'))
      not valid;
  end if;
end $$;

do $$
begin
  if to_regclass('public.posts') is not null then
    update public.posts
    set visibility = case
      when destination = 'church' then 'church'
      when destination = 'cell' then 'group'
      else coalesce(nullif(visibility, ''), 'public')
    end
    where visibility is null
       or visibility = ''
       or (visibility = 'public' and destination in ('church', 'cell'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.posts') is not null
     and exists (
       select 1
       from pg_constraint
       where conname = 'posts_visibility_check'
         and conrelid = 'public.posts'::regclass
         and not convalidated
     ) then
    alter table public.posts validate constraint posts_visibility_check;
  end if;
end $$;

create index if not exists idx_posts_visibility_created_at
  on public.posts (visibility, created_at desc);

create index if not exists idx_posts_user_visibility_created_at
  on public.posts (user_id, visibility, created_at desc);

create index if not exists idx_posts_church_visibility_created_at
  on public.posts (church_id, visibility, created_at desc);

create index if not exists idx_posts_cell_visibility_created_at
  on public.posts (cell_id, visibility, created_at desc);

create unique index if not exists idx_follows_unique_pair
  on public.follows (follower_id, following_id);

create index if not exists idx_follows_follower
  on public.follows (follower_id);

create index if not exists idx_follows_following
  on public.follows (following_id);

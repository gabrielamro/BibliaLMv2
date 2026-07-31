create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_display_name text not null,
  user_photo_url text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_comments_content_length check (char_length(btrim(content)) between 1 and 1000)
);

alter table public.post_comments
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.post_saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_hidden (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint post_reports_reason_check check (reason in ('spam', 'abuse', 'misinformation', 'privacy', 'other')),
  constraint post_reports_status_check check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  constraint post_reports_details_length check (details is null or char_length(details) <= 1000),
  unique (post_id, reporter_id)
);

create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at);
create index if not exists post_comments_user_idx on public.post_comments(user_id);
create index if not exists post_saves_user_created_idx on public.post_saves(user_id, created_at desc);
create index if not exists post_hidden_user_idx on public.post_hidden(user_id);
create index if not exists post_reports_status_created_idx on public.post_reports(status, created_at);

alter table public.post_comments enable row level security;
alter table public.post_saves enable row level security;
alter table public.post_hidden enable row level security;
alter table public.post_reports enable row level security;

drop policy if exists post_saves_owner_read on public.post_saves;
drop policy if exists post_saves_owner_insert on public.post_saves;
drop policy if exists post_saves_owner_delete on public.post_saves;
drop policy if exists post_hidden_owner_read on public.post_hidden;
drop policy if exists post_hidden_owner_insert on public.post_hidden;
drop policy if exists post_hidden_owner_delete on public.post_hidden;
drop policy if exists post_reports_owner_read on public.post_reports;
drop policy if exists post_reports_owner_insert on public.post_reports;

revoke all on public.post_comments, public.post_saves, public.post_hidden, public.post_reports from anon, authenticated;
grant select on public.post_comments to anon, authenticated;
grant insert, update(content, updated_at), delete on public.post_comments to authenticated;
grant select, insert, delete on public.post_saves to authenticated;
grant select, insert, delete on public.post_hidden to authenticated;
grant select, insert on public.post_reports to authenticated;

drop policy if exists "Comentários de posts são públicos" on public.post_comments;
drop policy if exists "Usuários comentam em posts" on public.post_comments;
drop policy if exists "Usuários deletam próprios comentários de posts" on public.post_comments;
drop policy if exists post_comments_visible_read on public.post_comments;
drop policy if exists post_comments_owner_insert on public.post_comments;
drop policy if exists post_comments_owner_update on public.post_comments;
drop policy if exists post_comments_owner_or_author_delete on public.post_comments;

create policy post_comments_visible_read on public.post_comments for select
to anon, authenticated
using (exists (select 1 from public.posts p where p.id = post_comments.post_id));

create policy post_comments_owner_insert on public.post_comments for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.posts p where p.id = post_comments.post_id)
);

create policy post_comments_owner_update on public.post_comments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy post_comments_owner_or_author_delete on public.post_comments for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.posts p
    where p.id = post_comments.post_id and p.user_id = (select auth.uid())
  )
);

create policy post_saves_owner_read on public.post_saves for select to authenticated
using ((select auth.uid()) = user_id);
create policy post_saves_owner_insert on public.post_saves for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.posts p where p.id = post_saves.post_id));
create policy post_saves_owner_delete on public.post_saves for delete to authenticated
using ((select auth.uid()) = user_id);

create policy post_hidden_owner_read on public.post_hidden for select to authenticated
using ((select auth.uid()) = user_id);
create policy post_hidden_owner_insert on public.post_hidden for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.posts p where p.id = post_hidden.post_id));
create policy post_hidden_owner_delete on public.post_hidden for delete to authenticated
using ((select auth.uid()) = user_id);

create policy post_reports_owner_read on public.post_reports for select to authenticated
using ((select auth.uid()) = reporter_id);
create policy post_reports_owner_insert on public.post_reports for insert to authenticated
with check (
  (select auth.uid()) = reporter_id
  and exists (select 1 from public.posts p where p.id = post_reports.post_id)
);

create or replace function public.sync_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_post_id uuid;
begin
  target_post_id := case when tg_op = 'DELETE' then old.post_id else new.post_id end;
  update public.posts
  set comments_count = (
    select count(*)::integer from public.post_comments where post_id = target_post_id
  )
  where id = target_post_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.sync_post_comments_count() from public, anon, authenticated;

drop trigger if exists sync_post_comments_count_after_write on public.post_comments;
create trigger sync_post_comments_count_after_write
after insert or delete on public.post_comments
for each row execute function public.sync_post_comments_count();

create or replace function public.set_post_save(p_post_id uuid, p_saved boolean)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare viewer_id uuid := (select auth.uid());
begin
  if viewer_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_saved then
    insert into public.post_saves(post_id, user_id) values (p_post_id, viewer_id) on conflict do nothing;
  else
    delete from public.post_saves where post_id = p_post_id and user_id = viewer_id;
  end if;
  return exists(select 1 from public.post_saves where post_id = p_post_id and user_id = viewer_id);
end;
$$;

revoke all on function public.set_post_save(uuid, boolean) from public, anon;
grant execute on function public.set_post_save(uuid, boolean) to authenticated;

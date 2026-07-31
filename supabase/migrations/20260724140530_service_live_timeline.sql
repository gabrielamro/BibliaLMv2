create table if not exists public.service_prayer_timeline_events (
  prayer_id text primary key references public.service_prayer_requests(id) on delete cascade,
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_name text not null default 'Membro',
  user_photo_url text,
  is_private boolean not null default false,
  content_preview text,
  created_at timestamptz not null default now(),
  constraint service_prayer_timeline_preview_length check (content_preview is null or char_length(content_preview) <= 120),
  constraint service_prayer_timeline_private_redacted check ((is_private and content_preview is null) or (not is_private))
);

create index if not exists service_prayer_timeline_service_created_idx
  on public.service_prayer_timeline_events(service_id, created_at desc);

create table if not exists public.service_liturgy_comments (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  liturgy_item_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default 'Membro',
  user_photo_url text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_liturgy_comments_content_length check (char_length(btrim(content)) between 1 and 500),
  unique(service_id, liturgy_item_id, user_id)
);

create index if not exists service_liturgy_comments_service_item_created_idx
  on public.service_liturgy_comments(service_id, liturgy_item_id, created_at asc);

alter table public.service_prayer_timeline_events enable row level security;
alter table public.service_liturgy_comments enable row level security;

revoke all on public.service_prayer_timeline_events from anon, authenticated;
grant select on public.service_prayer_timeline_events to anon, authenticated;

revoke all on public.service_liturgy_comments from anon, authenticated;
grant select on public.service_liturgy_comments to anon, authenticated;
grant insert on public.service_liturgy_comments to authenticated;
grant update(content, updated_at) on public.service_liturgy_comments to authenticated;
grant delete on public.service_liturgy_comments to authenticated;

drop policy if exists "Public can read redacted service prayer timeline" on public.service_prayer_timeline_events;
create policy "Public can read redacted service prayer timeline"
  on public.service_prayer_timeline_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read service liturgy comments" on public.service_liturgy_comments;
create policy "Public can read service liturgy comments"
  on public.service_liturgy_comments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create one comment per liturgy moment" on public.service_liturgy_comments;
create policy "Users can create one comment per liturgy moment"
  on public.service_liturgy_comments
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.church_services
      where church_services.id = service_liturgy_comments.service_id
        and church_services.church_id = service_liturgy_comments.church_id
        and church_services.status in ('published', 'checkin_open', 'live', 'in_progress')
    )
  );

drop policy if exists "Users can update own liturgy comment" on public.service_liturgy_comments;
create policy "Users can update own liturgy comment"
  on public.service_liturgy_comments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own liturgy comment" on public.service_liturgy_comments;
create policy "Users can delete own liturgy comment"
  on public.service_liturgy_comments
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.sync_service_prayer_timeline_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.service_prayer_timeline_events where prayer_id = old.id;
    return old;
  end if;

  insert into public.service_prayer_timeline_events (
    prayer_id,
    service_id,
    church_id,
    user_name,
    user_photo_url,
    is_private,
    content_preview,
    created_at
  ) values (
    new.id,
    new.service_id,
    new.church_id,
    coalesce(nullif(btrim(new.user_name), ''), 'Membro'),
    new.user_photo_url,
    new.is_private,
    case
      when new.is_private then null
      else left(regexp_replace(btrim(new.content), '\s+', ' ', 'g'), 120)
    end,
    new.created_at
  )
  on conflict (prayer_id) do update set
    service_id = excluded.service_id,
    church_id = excluded.church_id,
    user_name = excluded.user_name,
    user_photo_url = excluded.user_photo_url,
    is_private = excluded.is_private,
    content_preview = excluded.content_preview,
    created_at = excluded.created_at;

  return new;
end;
$$;

revoke all on function private.sync_service_prayer_timeline_event() from public, anon, authenticated;

drop trigger if exists service_prayer_timeline_sync on public.service_prayer_requests;
create trigger service_prayer_timeline_sync
  after insert or update of content, is_private, user_name, user_photo_url or delete
  on public.service_prayer_requests
  for each row execute function private.sync_service_prayer_timeline_event();

insert into public.service_prayer_timeline_events (
  prayer_id,
  service_id,
  church_id,
  user_name,
  user_photo_url,
  is_private,
  content_preview,
  created_at
)
select
  prayer.id,
  prayer.service_id,
  prayer.church_id,
  coalesce(nullif(btrim(prayer.user_name), ''), 'Membro'),
  prayer.user_photo_url,
  prayer.is_private,
  case
    when prayer.is_private then null
    else left(regexp_replace(btrim(prayer.content), '\s+', ' ', 'g'), 120)
  end,
  prayer.created_at
from public.service_prayer_requests prayer
on conflict (prayer_id) do update set
  service_id = excluded.service_id,
  church_id = excluded.church_id,
  user_name = excluded.user_name,
  user_photo_url = excluded.user_photo_url,
  is_private = excluded.is_private,
  content_preview = excluded.content_preview,
  created_at = excluded.created_at;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'service_prayer_timeline_events'
  ) then
    alter publication supabase_realtime add table public.service_prayer_timeline_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'service_liturgy_comments'
  ) then
    alter publication supabase_realtime add table public.service_liturgy_comments;
  end if;
exception
  when undefined_object then
    null;
end $$;

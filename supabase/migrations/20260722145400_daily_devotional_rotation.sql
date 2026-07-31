-- Shared daily devotional rotation and per-user, once-a-day refresh.
create extension if not exists pgcrypto;

create table if not exists public.daily_devotional_content (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  title text not null check (length(trim(title)) > 0),
  verse_reference text not null check (length(trim(verse_reference)) > 0),
  verse_text text not null check (length(trim(verse_text)) > 0),
  content text not null check (length(trim(content)) > 0),
  prayer text not null check (length(trim(prayer)) > 0),
  source text not null default 'ai' check (source in ('ai', 'legacy', 'curated')),
  source_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_devotional_schedule (
  devotional_date date primary key,
  content_id uuid not null references public.daily_devotional_content(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.user_daily_devotional_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  devotional_date date not null,
  content_id uuid not null references public.daily_devotional_content(id) on delete restrict,
  refresh_reservation_id uuid,
  refresh_reserved_at timestamptz,
  refresh_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, devotional_date),
  check (
    (refresh_reservation_id is null and refresh_reserved_at is null)
    or (refresh_reservation_id is not null and refresh_reserved_at is not null)
  )
);

create table if not exists public.user_daily_devotional_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.daily_devotional_content(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create index if not exists daily_devotional_schedule_content_idx
  on public.daily_devotional_schedule (content_id, devotional_date desc);
create index if not exists daily_devotional_content_created_idx
  on public.daily_devotional_content (created_at desc);
create index if not exists user_daily_devotional_state_user_date_idx
  on public.user_daily_devotional_state (user_id, devotional_date desc);
create index if not exists user_daily_devotional_views_user_seen_idx
  on public.user_daily_devotional_views (user_id, first_seen_at desc);

alter table public.daily_devotional_content enable row level security;
alter table public.daily_devotional_schedule enable row level security;
alter table public.user_daily_devotional_state enable row level security;
alter table public.user_daily_devotional_views enable row level security;

drop policy if exists "Daily devotional content is readable" on public.daily_devotional_content;
create policy "Daily devotional content is readable"
  on public.daily_devotional_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Daily devotional schedule is readable" on public.daily_devotional_schedule;
create policy "Daily devotional schedule is readable"
  on public.daily_devotional_schedule for select
  to anon, authenticated
  using (true);

drop policy if exists "Users read their devotional state" on public.user_daily_devotional_state;
create policy "Users read their devotional state"
  on public.user_daily_devotional_state for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read their devotional history" on public.user_daily_devotional_views;
create policy "Users read their devotional history"
  on public.user_daily_devotional_views for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.daily_devotional_content from anon, authenticated;
revoke all on public.daily_devotional_schedule from anon, authenticated;
revoke all on public.user_daily_devotional_state from anon, authenticated;
revoke all on public.user_daily_devotional_views from anon, authenticated;

grant select on public.daily_devotional_content to anon, authenticated;
grant select on public.daily_devotional_schedule to anon, authenticated;
grant select on public.user_daily_devotional_state to authenticated;
grant select on public.user_daily_devotional_views to authenticated;

comment on table public.daily_devotional_schedule is
  'One canonical Pao Diario per Manaus calendar day. The date primary key makes the first successful insert authoritative.';
comment on table public.user_daily_devotional_state is
  'Daily content assigned to a user and the server-controlled once-per-day refresh reservation.';

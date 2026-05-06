-- Historico do Pao Diario por usuario.
-- Execute no Supabase SQL Editor.

create table if not exists public.user_devotionals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id text not null,
  is_amen boolean default false,
  reflection text,
  created_at timestamptz default now(),
  unique (user_id, content_id)
);

alter table public.user_devotionals
  add column if not exists is_amen boolean default false;

alter table public.user_devotionals
  add column if not exists reflection text;

alter table public.user_devotionals
  add column if not exists created_at timestamptz default now();

create index if not exists user_devotionals_user_created_at_idx
  on public.user_devotionals (user_id, created_at desc);

alter table public.user_devotionals enable row level security;

drop policy if exists "Users can read own devotional history" on public.user_devotionals;
create policy "Users can read own devotional history"
  on public.user_devotionals
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own devotional history" on public.user_devotionals;
create policy "Users can insert own devotional history"
  on public.user_devotionals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own devotional history" on public.user_devotionals;
create policy "Users can update own devotional history"
  on public.user_devotionals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Personal service journals: private "Meu Culto" records for members.
-- Safe to run multiple times.

create table if not exists public.personal_service_journals (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  church_id uuid null references public.churches(id) on delete set null,
  church_name text not null,
  linked_service_id text null references public.church_services(id) on delete set null,
  title text not null,
  theme text,
  preacher_name text,
  service_type text,
  service_date date not null,
  starts_at timestamptz,
  ends_at timestamptz,
  songs jsonb not null default '[]'::jsonb,
  verses jsonb not null default '[]'::jsonb,
  message_notes text,
  prayers jsonb not null default '[]'::jsonb,
  feelings jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_service_journals_user_date_idx
  on public.personal_service_journals(user_id, service_date desc);

alter table public.personal_service_journals enable row level security;

drop policy if exists "Users can read own personal service journals" on public.personal_service_journals;
create policy "Users can read own personal service journals"
  on public.personal_service_journals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own personal service journals" on public.personal_service_journals;
create policy "Users can create own personal service journals"
  on public.personal_service_journals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own personal service journals" on public.personal_service_journals;
create policy "Users can update own personal service journals"
  on public.personal_service_journals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own personal service journals" on public.personal_service_journals;
create policy "Users can delete own personal service journals"
  on public.personal_service_journals for delete
  using (auth.uid() = user_id);

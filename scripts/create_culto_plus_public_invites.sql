-- Public/social invites for Culto+ OnePage.
-- Safe to run multiple times.

create table if not exists public.service_public_invites (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  invited_by_user_id uuid references public.profiles(id) on delete set null,
  invited_by_name text,
  invited_user_id uuid references public.profiles(id) on delete set null,
  invited_name text,
  token text not null unique,
  status text not null default 'created' check (status in ('created', 'opened', 'accepted', 'cancelled')),
  source text not null default 'share' check (source in ('copy', 'share', 'qr', 'manual')),
  opened_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_public_invites_service_status_idx
  on public.service_public_invites(service_id, status, created_at desc);

create index if not exists service_public_invites_token_idx
  on public.service_public_invites(token);

create index if not exists service_public_invites_invited_by_idx
  on public.service_public_invites(invited_by_user_id, created_at desc);

alter table public.service_public_invites enable row level security;

grant select on public.service_public_invites to anon, authenticated;
grant insert, update on public.service_public_invites to authenticated;

drop policy if exists "Public can read service invites by token" on public.service_public_invites;
create policy "Public can read service invites by token"
  on public.service_public_invites
  for select
  to anon, authenticated
  using (status in ('created', 'opened', 'accepted'));

drop policy if exists "Authenticated users can create service invites" on public.service_public_invites;
create policy "Authenticated users can create service invites"
  on public.service_public_invites
  for insert
  to authenticated
  with check ((select auth.uid()) = invited_by_user_id);

drop policy if exists "Invite actors can update service invites" on public.service_public_invites;
create policy "Invite actors can update service invites"
  on public.service_public_invites
  for update
  to authenticated
  using (
    (select auth.uid()) = invited_by_user_id
    or invited_user_id is null
    or (select auth.uid()) = invited_user_id
  )
  with check (
    (select auth.uid()) = invited_by_user_id
    or invited_user_id is null
    or (select auth.uid()) = invited_user_id
  );

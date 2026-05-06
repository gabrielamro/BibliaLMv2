-- Estrutura de igrejas do BibliaLM.
-- Execute no Supabase SQL Editor antes de ativar a busca/vinculo de igrejas.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.churches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  acronym text,
  denomination text,
  location_city text,
  location_state text,
  location_address text,
  lat double precision,
  lng double precision,
  external_provider text,
  external_place_id text,
  source_attribution text,
  verification_status text not null default 'unclaimed'
    check (verification_status in ('unclaimed', 'claimed', 'verified')),
  admins uuid[] default '{}',
  teams jsonb default '[]',
  team_scores jsonb default '{}',
  logo_url text,
  pastor_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (external_provider, external_place_id)
);

alter table public.churches
  add column if not exists acronym text;

alter table public.churches
  add column if not exists denomination text;

alter table public.churches
  add column if not exists location_city text;

alter table public.churches
  add column if not exists location_state text;

alter table public.churches
  add column if not exists location_address text;

alter table public.churches
  add column if not exists logo_url text;

alter table public.churches
  add column if not exists pastor_name text;

alter table public.churches
  add column if not exists lat double precision;

alter table public.churches
  add column if not exists lng double precision;

alter table public.churches
  add column if not exists external_provider text;

alter table public.churches
  add column if not exists external_place_id text;

alter table public.churches
  add column if not exists source_attribution text;

alter table public.churches
  add column if not exists verification_status text not null default 'unclaimed';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'churches_verification_status_check'
  ) then
    alter table public.churches
      add constraint churches_verification_status_check
      check (verification_status in ('unclaimed', 'claimed', 'verified'));
  end if;
end $$;

alter table public.churches
  add column if not exists admins uuid[] default '{}';

alter table public.churches
  add column if not exists teams jsonb default '[]';

alter table public.churches
  add column if not exists team_scores jsonb default '{}';

alter table public.churches
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.churches
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'churches_external_provider_external_place_id_key'
  ) then
    alter table public.churches
      add constraint churches_external_provider_external_place_id_key
      unique (external_provider, external_place_id);
  end if;
end $$;

create index if not exists churches_location_idx
  on public.churches (location_state, location_city);

create index if not exists churches_name_trgm_idx
  on public.churches using gin (name gin_trgm_ops);

create table if not exists public.cells (
  id uuid default gen_random_uuid() primary key,
  church_id uuid references public.churches(id) on delete cascade,
  parent_group_id uuid references public.cells(id) on delete cascade,
  name text not null,
  slug text unique not null,
  leader_id uuid references public.profiles(id) on delete set null,
  leader_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.cells
  add column if not exists church_id uuid references public.churches(id) on delete cascade;

alter table public.cells
  add column if not exists parent_group_id uuid references public.cells(id) on delete cascade;

alter table public.cells
  add column if not exists leader_id uuid references public.profiles(id) on delete set null;

alter table public.cells
  add column if not exists leader_name text;

alter table public.cells
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.cells
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cells_slug_key'
  ) then
    begin
      alter table public.cells
        add constraint cells_slug_key
        unique (slug);
    exception
      when unique_violation then
        raise notice 'Nao foi possivel criar cells_slug_key: existem slugs duplicados em public.cells. Exclua os grupos duplicados e execute novamente.';
    end;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cells_church_id_parent_group_id_name_key'
  ) then
    begin
      alter table public.cells
        add constraint cells_church_id_parent_group_id_name_key
        unique nulls not distinct (church_id, parent_group_id, name);
    exception
      when unique_violation then
        raise notice 'Nao foi possivel criar cells_church_id_parent_group_id_name_key: existem grupos duplicados na mesma igreja. Exclua os duplicados e execute novamente.';
    end;
  end if;
end $$;

create table if not exists public.memberships (
  user_id uuid references public.profiles(id) primary key,
  church_id uuid references public.churches(id) on delete cascade,
  cell_id uuid references public.cells(id) on delete set null,
  role text default 'member',
  joined_at timestamptz default now()
);

alter table public.memberships
  add column if not exists church_id uuid references public.churches(id) on delete cascade;

alter table public.memberships
  add column if not exists cell_id uuid references public.cells(id) on delete set null;

alter table public.memberships
  add column if not exists role text default 'member';

alter table public.memberships
  add column if not exists joined_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'memberships_cell_id_fkey'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      drop constraint memberships_cell_id_fkey;
  end if;

  alter table public.memberships
    add constraint memberships_cell_id_fkey
    foreign key (cell_id)
    references public.cells(id)
    on delete set null;
end $$;

create table if not exists public.church_role_requests (
  id uuid default gen_random_uuid() primary key,
  church_id uuid references public.churches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  requested_role text not null default 'pastor'
    check (requested_role in ('pastor', 'admin')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  unique (church_id, user_id, requested_role)
);

create table if not exists public.church_followers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  church_id uuid references public.churches(id) on delete cascade not null,
  followed_at timestamptz default now(),
  unique (user_id, church_id)
);

create table if not exists public.prayer_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  user_name text,
  user_photo_url text,
  content text not null,
  target_type text,
  target_id uuid,
  church_id uuid references public.churches(id) on delete cascade,
  cell_name text,
  intercessors_count int default 0,
  intercessors jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.prayer_requests
  add column if not exists user_name text;

alter table public.prayer_requests
  add column if not exists user_photo_url text;

alter table public.prayer_requests
  add column if not exists target_type text;

alter table public.prayer_requests
  add column if not exists target_id uuid;

alter table public.prayer_requests
  add column if not exists cell_name text;

alter table public.prayer_requests
  add column if not exists intercessors_count int default 0;

alter table public.prayer_requests
  add column if not exists intercessors jsonb default '[]';

alter table public.prayer_requests
  add column if not exists church_id uuid references public.churches(id) on delete cascade;

alter table public.churches enable row level security;
alter table public.cells enable row level security;
alter table public.memberships enable row level security;
alter table public.church_role_requests enable row level security;
alter table public.church_followers enable row level security;
alter table public.prayer_requests enable row level security;

drop policy if exists "Churches are public" on public.churches;
create policy "Churches are public"
  on public.churches
  for select
  using (true);

drop policy if exists "Authenticated users can create churches" on public.churches;
create policy "Authenticated users can create churches"
  on public.churches
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Church admins can update churches" on public.churches;
create policy "Church admins can update churches"
  on public.churches
  for update
  using (auth.uid() = any(admins))
  with check (auth.uid() = any(admins));

drop policy if exists "Users can read memberships" on public.memberships;
create policy "Users can read memberships"
  on public.memberships
  for select
  using (true);

drop policy if exists "Users manage own membership" on public.memberships;
create policy "Users manage own membership"
  on public.memberships
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read church groups" on public.cells;
create policy "Users can read church groups"
  on public.cells
  for select
  using (true);

drop policy if exists "Authenticated users can create church groups" on public.cells;
create policy "Authenticated users can create church groups"
  on public.cells
  for insert
  with check (auth.uid() is not null and auth.uid() = created_by);

drop policy if exists "Group creators can update church groups" on public.cells;
create policy "Group creators can update church groups"
  on public.cells
  for update
  using (
    auth.uid() = created_by
    or auth.uid() = leader_id
    or exists (
      select 1
      from public.churches
      where churches.id = cells.church_id
        and auth.uid() = any(churches.admins)
    )
  )
  with check (
    auth.uid() = created_by
    or auth.uid() = leader_id
    or exists (
      select 1
      from public.churches
      where churches.id = cells.church_id
        and auth.uid() = any(churches.admins)
    )
  );

drop policy if exists "Group creators can delete church groups" on public.cells;
create policy "Group creators can delete church groups"
  on public.cells
  for delete
  using (
    auth.uid() = created_by
    or auth.uid() = leader_id
    or exists (
      select 1
      from public.churches
      where churches.id = cells.church_id
        and auth.uid() = any(churches.admins)
    )
  );

drop policy if exists "Users can read own responsibility requests" on public.church_role_requests;
create policy "Users can read own responsibility requests"
  on public.church_role_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can request church responsibility" on public.church_role_requests;
create policy "Users can request church responsibility"
  on public.church_role_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own pending responsibility requests" on public.church_role_requests;
create policy "Users can update own pending responsibility requests"
  on public.church_role_requests
  for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users can read church followers" on public.church_followers;
create policy "Users can read church followers"
  on public.church_followers
  for select
  using (true);

drop policy if exists "Users can follow churches" on public.church_followers;
create policy "Users can follow churches"
  on public.church_followers
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow churches" on public.church_followers;
create policy "Users can unfollow churches"
  on public.church_followers
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read prayer requests" on public.prayer_requests;
create policy "Users can read prayer requests"
  on public.prayer_requests
  for select
  using (true);

drop policy if exists "Users can create own prayer requests" on public.prayer_requests;
create policy "Users can create own prayer requests"
  on public.prayer_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own prayer requests" on public.prayer_requests;
create policy "Users can update own prayer requests"
  on public.prayer_requests
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own prayer requests" on public.prayer_requests;
create policy "Users can delete own prayer requests"
  on public.prayer_requests
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Church admins can delete church prayer requests" on public.prayer_requests;
create policy "Church admins can delete church prayer requests"
  on public.prayer_requests
  for delete
  using (
    exists (
      select 1
      from public.churches c
      where c.id = prayer_requests.church_id
        and auth.uid() = any(c.admins)
    )
  );

drop policy if exists "Group leaders can delete group prayer requests" on public.prayer_requests;
create policy "Group leaders can delete group prayer requests"
  on public.prayer_requests
  for delete
  using (
    exists (
      select 1
      from public.cells g
      where g.id = prayer_requests.target_id
        and (g.created_by = auth.uid() or g.leader_id = auth.uid())
    )
  );

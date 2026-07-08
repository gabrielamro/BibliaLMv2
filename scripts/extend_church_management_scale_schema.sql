-- Extensao operacional da Gestao da Igreja: funcoes, vagas, convites e participacao.
-- Execute depois de scripts/create_church_management.sql.

create extension if not exists pgcrypto;

create table if not exists public.church_team_functions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  team_id uuid not null references public.church_service_teams(id) on delete cascade,
  name text not null,
  description text not null default '',
  required_count integer not null default 1 check (required_count >= 0),
  profile_hint text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, team_id, name)
);

create table if not exists public.church_service_scale_slots (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id uuid not null references public.church_services(id) on delete cascade,
  team_id uuid not null references public.church_service_teams(id) on delete cascade,
  function_id uuid null references public.church_team_functions(id) on delete set null,
  function_name text not null,
  required_count integer not null default 1 check (required_count >= 0),
  assigned_count integer not null default 0 check (assigned_count >= 0),
  status text not null default 'open' check (status in ('open', 'filled', 'cancelled')),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, service_id, team_id, function_name)
);

create table if not exists public.church_service_invites (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id uuid not null references public.church_services(id) on delete cascade,
  team_id uuid null references public.church_service_teams(id) on delete set null,
  slot_id uuid null references public.church_service_scale_slots(id) on delete set null,
  assignment_id uuid null references public.church_assignments(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default '',
  status text not null default 'pending' check (status in ('not_sent', 'pending', 'confirmed', 'declined', 'expired', 'cancelled', 'conflict')),
  response_note text not null default '',
  sent_at timestamptz null,
  responded_at timestamptz null,
  expires_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists church_service_invites_unique_idx
  on public.church_service_invites (church_id, service_id, team_id, user_id, role);

create table if not exists public.church_participation_logs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id uuid null references public.church_services(id) on delete set null,
  team_id uuid null references public.church_service_teams(id) on delete set null,
  assignment_id uuid null references public.church_assignments(id) on delete set null,
  invite_id uuid null references public.church_service_invites(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('participated', 'missed', 'justified_absence', 'replaced', 'cancelled')),
  role text not null default '',
  notes text not null default '',
  recorded_by uuid null references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists church_team_functions_team_status_idx
  on public.church_team_functions (church_id, team_id, status);
create index if not exists church_service_scale_slots_service_team_idx
  on public.church_service_scale_slots (church_id, service_id, team_id, status);
create index if not exists church_service_invites_user_status_idx
  on public.church_service_invites (user_id, status, service_id);
create index if not exists church_service_invites_service_status_idx
  on public.church_service_invites (church_id, service_id, status);
create index if not exists church_participation_logs_user_idx
  on public.church_participation_logs (church_id, user_id, recorded_at desc);
create index if not exists church_participation_logs_service_idx
  on public.church_participation_logs (church_id, service_id, team_id);

alter table public.church_team_functions enable row level security;
alter table public.church_service_scale_slots enable row level security;
alter table public.church_service_invites enable row level security;
alter table public.church_participation_logs enable row level security;

grant select, insert, update, delete on public.church_team_functions to authenticated;
grant select, insert, update, delete on public.church_service_scale_slots to authenticated;
grant select, insert, update on public.church_service_invites to authenticated;
grant select, insert, update on public.church_participation_logs to authenticated;

drop policy if exists "Team functions readable by church operators" on public.church_team_functions;
create policy "Team functions readable by church operators"
  on public.church_team_functions for select
  to authenticated
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Team functions managed by operators" on public.church_team_functions;
create policy "Team functions managed by operators"
  on public.church_team_functions for all
  to authenticated
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id))
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Scale slots readable by operators" on public.church_service_scale_slots;
create policy "Scale slots readable by operators"
  on public.church_service_scale_slots for select
  to authenticated
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Scale slots managed by operators" on public.church_service_scale_slots;
create policy "Scale slots managed by operators"
  on public.church_service_scale_slots for all
  to authenticated
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id))
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Invites readable by assignee or operators" on public.church_service_invites;
create policy "Invites readable by assignee or operators"
  on public.church_service_invites for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id)
  );

drop policy if exists "Invites managed by operators" on public.church_service_invites;
create policy "Invites managed by operators"
  on public.church_service_invites for insert
  to authenticated
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Invites updated by assignee or operators" on public.church_service_invites;
create policy "Invites updated by assignee or operators"
  on public.church_service_invites for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id)
  )
  with check (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id)
  );

drop policy if exists "Participation readable by member or operators" on public.church_participation_logs;
create policy "Participation readable by member or operators"
  on public.church_participation_logs for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id)
  );

drop policy if exists "Participation recorded by operators" on public.church_participation_logs;
create policy "Participation recorded by operators"
  on public.church_participation_logs for insert
  to authenticated
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

drop policy if exists "Participation updated by operators" on public.church_participation_logs;
create policy "Participation updated by operators"
  on public.church_participation_logs for update
  to authenticated
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id))
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], 'team', team_id));

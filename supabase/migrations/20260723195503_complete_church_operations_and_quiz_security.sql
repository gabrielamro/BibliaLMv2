-- Completa a estrutura operacional usada pelo app e alinha o acesso por papel.
-- Regras: gestor administra a igreja; pastor cuida apenas de fluxos pastorais;
-- lider opera somente no escopo recebido; membro/voluntario ve apenas o proprio fluxo.

create extension if not exists pgcrypto;

create table public.church_team_functions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  team_id uuid not null references public.church_service_teams(id) on delete cascade,
  name text not null,
  description text not null default '',
  required_count integer not null default 1 check (required_count >= 0),
  profile_hint text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, team_id, name)
);

create table public.church_service_scale_slots (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  -- church_services.id e textual (ex.: svc_...), portanto esta FK tambem deve ser text.
  service_id text not null references public.church_services(id) on delete cascade,
  team_id uuid not null references public.church_service_teams(id) on delete cascade,
  function_id uuid references public.church_team_functions(id) on delete set null,
  function_name text not null,
  required_count integer not null default 1 check (required_count >= 0),
  assigned_count integer not null default 0 check (assigned_count >= 0),
  status text not null default 'open' check (status in ('open', 'filled', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, service_id, team_id, function_name)
);

create table public.church_service_invites (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id text not null references public.church_services(id) on delete cascade,
  team_id uuid references public.church_service_teams(id) on delete set null,
  slot_id uuid references public.church_service_scale_slots(id) on delete set null,
  assignment_id uuid references public.church_assignments(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default '',
  status text not null default 'pending'
    check (status in ('not_sent', 'pending', 'confirmed', 'declined', 'expired', 'cancelled', 'conflict')),
  response_note text not null default '',
  sent_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index church_service_invites_unique_idx
  on public.church_service_invites (church_id, service_id, team_id, user_id, role)
  nulls not distinct;

create table public.church_participation_logs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id text references public.church_services(id) on delete set null,
  team_id uuid references public.church_service_teams(id) on delete set null,
  assignment_id uuid references public.church_assignments(id) on delete set null,
  invite_id uuid references public.church_service_invites(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null
    check (status in ('participated', 'missed', 'justified_absence', 'replaced', 'cancelled')),
  role text not null default '',
  notes text not null default '',
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.custom_quizzes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  description text not null default '',
  category text not null default 'Geral',
  type text not null default 'manual' check (type in ('ai_generated', 'manual')),
  game_mode text not null default 'classic' check (game_mode in ('classic', 'infinite')),
  ai_config jsonb,
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ai_config is null or jsonb_typeof(ai_config) = 'object'),
  check (jsonb_typeof(questions) = 'array')
);

create index church_team_functions_team_status_idx
  on public.church_team_functions (church_id, team_id, status);
create index church_service_scale_slots_service_team_idx
  on public.church_service_scale_slots (church_id, service_id, team_id, status);
create index church_service_invites_user_status_idx
  on public.church_service_invites (user_id, status, service_id);
create index church_service_invites_service_status_idx
  on public.church_service_invites (church_id, service_id, status);
create index church_participation_logs_user_idx
  on public.church_participation_logs (church_id, user_id, recorded_at desc);
create index church_participation_logs_service_idx
  on public.church_participation_logs (church_id, service_id, team_id);
create index custom_quizzes_author_created_idx
  on public.custom_quizzes (author_id, created_at desc);
create index custom_quizzes_active_created_idx
  on public.custom_quizzes (created_at desc)
  where is_active;

alter table public.church_team_functions enable row level security;
alter table public.church_service_scale_slots enable row level security;
alter table public.church_service_invites enable row level security;
alter table public.church_participation_logs enable row level security;
alter table public.custom_quizzes enable row level security;

-- Escopo explicito permite que QR Codes de equipe sejam administrados apenas
-- pelo lider daquela equipe, sem ampliar o acesso para a igreja inteira.
alter table public.church_qr_forms
  add column if not exists scope_type text not null default 'church',
  add column if not exists scope_id uuid;

update public.church_qr_forms
set
  scope_type = 'team',
  scope_id = substring(destination from 6)::uuid
where destination ~* '^team:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

update public.church_qr_forms
set allow_anonymous = false
where form_type = 'volunteer'
  and allow_anonymous = true;

alter table public.church_qr_forms
  add constraint church_qr_forms_scope_type_check
  check (scope_type in ('church', 'team', 'group', 'service', 'event'));

alter table public.church_qr_forms
  add constraint church_qr_forms_scope_id_check
  check (scope_type = 'church' or scope_id is not null);

grant select, insert, update, delete on public.church_team_functions to authenticated;
grant select, insert, update, delete on public.church_service_scale_slots to authenticated;
grant select, insert, update on public.church_service_invites to authenticated;
grant select, insert, update on public.church_participation_logs to authenticated;
grant select on public.custom_quizzes to anon;
grant select, insert, update, delete on public.custom_quizzes to authenticated;
grant all on public.church_team_functions, public.church_service_scale_slots,
  public.church_service_invites, public.church_participation_logs, public.custom_quizzes
  to service_role;

create policy "Team functions readable by church members"
  on public.church_team_functions for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships membership
      where membership.church_id = church_team_functions.church_id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "Team functions managed by scoped operators"
  on public.church_team_functions for all
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );

create policy "Scale slots readable by scoped operators"
  on public.church_service_scale_slots for select
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );

create policy "Scale slots managed by scoped operators"
  on public.church_service_scale_slots for all
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );

create policy "Invites readable by assignee or scoped operators"
  on public.church_service_invites for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Invites created by scoped operators"
  on public.church_service_invites for insert
  to authenticated
  with check (
    public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Invites updated by assignee or scoped operators"
  on public.church_service_invites for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  )
  with check (
    user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Participation readable by member or scoped operators"
  on public.church_participation_logs for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Participation recorded by scoped operators"
  on public.church_participation_logs for insert
  to authenticated
  with check (
    public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Participation updated by scoped operators"
  on public.church_participation_logs for update
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  )
  with check (
    public.can_manage_church_operations(church_id)
    or (
      team_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', team_id)
    )
  );

create policy "Active quizzes are publicly readable"
  on public.custom_quizzes for select
  to anon, authenticated
  using (is_active or author_id = (select auth.uid()));

create policy "Authors create quizzes"
  on public.custom_quizzes for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Authors update quizzes"
  on public.custom_quizzes for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Authors delete quizzes"
  on public.custom_quizzes for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Corrige o acesso administrativo que antes tratava pastor como gestor.
drop policy if exists "Church operators manage QR forms" on public.church_qr_forms;
create policy "Scoped roles manage QR forms"
  on public.church_qr_forms for all
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or (
      form_type in ('prayer', 'pastor_care')
      and public.can_manage_church_care(church_id)
    )
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  )
  with check (
    public.can_manage_church_operations(church_id)
    or (
      form_type in ('prayer', 'pastor_care')
      and public.can_manage_church_care(church_id)
    )
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  );

drop policy if exists "Church operators create teams" on public.church_service_teams;
create policy "Church managers create teams"
  on public.church_service_teams for insert
  to authenticated
  with check (public.can_manage_church_operations(church_id));

drop policy if exists "Church operators update teams" on public.church_service_teams;
create policy "Managers or scoped leaders update teams"
  on public.church_service_teams for update
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', id)
  );

drop policy if exists "Church operators delete teams" on public.church_service_teams;
create policy "Church managers delete teams"
  on public.church_service_teams for delete
  to authenticated
  using (public.can_manage_church_operations(church_id));

drop policy if exists "Assignments readable by operators leaders and assignee" on public.church_assignments;
create policy "Assignments readable by scoped operators and assignee"
  on public.church_assignments for select
  to authenticated
  using (
    assignee_user_id = (select auth.uid())
    or leader_user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], scope_type, scope_id)
  );

drop policy if exists "Submissions readable by self or authorized church roles" on public.church_form_submissions;
create policy "Submissions readable by self or authorized scoped roles"
  on public.church_form_submissions for select
  to authenticated
  using (
    submitter_user_id = (select auth.uid())
    or assigned_to = (select auth.uid())
    or (
      is_sensitive = false
      and public.can_manage_church_operations(church_id)
    )
    or (
      is_sensitive = true
      and public.can_manage_church_care(church_id)
    )
    or (
      is_sensitive = false
      and exists (
        select 1
        from public.church_qr_forms form
        where form.id = church_form_submissions.form_id
          and form.scope_type = 'team'
          and form.scope_id is not null
          and public.has_church_role(form.church_id, array['leader'], 'team', form.scope_id)
      )
    )
  );

drop policy if exists "Public can create active form submissions" on public.church_form_submissions;
create policy "Public can create active form submissions"
  on public.church_form_submissions for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.church_qr_forms form
      where form.id = church_form_submissions.form_id
        and form.church_id = church_form_submissions.church_id
        and form.form_type = church_form_submissions.form_type
        and form.status = 'active'
        and (form.expires_at is null or form.expires_at > now())
        and (
          form.form_type <> 'volunteer'
          or (
            (select auth.uid()) is not null
            and church_form_submissions.submitter_user_id = (select auth.uid())
            and exists (
              select 1
              from public.memberships membership
              where membership.user_id = (select auth.uid())
                and membership.church_id = church_form_submissions.church_id
            )
          )
        )
    )
  );

drop policy if exists "Authorized users update submissions" on public.church_form_submissions;
create policy "Authorized scoped roles update submissions"
  on public.church_form_submissions for update
  to authenticated
  using (
    assigned_to = (select auth.uid())
    or (is_sensitive = false and public.can_manage_church_operations(church_id))
    or (is_sensitive = true and public.can_manage_church_care(church_id))
    or (
      is_sensitive = false
      and exists (
        select 1
        from public.church_qr_forms form
        where form.id = church_form_submissions.form_id
          and form.scope_type = 'team'
          and form.scope_id is not null
          and public.has_church_role(form.church_id, array['leader'], 'team', form.scope_id)
      )
    )
  )
  with check (
    assigned_to = (select auth.uid())
    or (is_sensitive = false and public.can_manage_church_operations(church_id))
    or (is_sensitive = true and public.can_manage_church_care(church_id))
    or (
      is_sensitive = false
      and exists (
        select 1
        from public.church_qr_forms form
        where form.id = church_form_submissions.form_id
          and form.scope_type = 'team'
          and form.scope_id is not null
          and public.has_church_role(form.church_id, array['leader'], 'team', form.scope_id)
      )
    )
  );

drop policy if exists "Church members can create services" on public.church_services;
create policy "Church managers create services"
  on public.church_services for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_manage_church_operations(church_id)
  );

drop policy if exists "Authors can update their services" on public.church_services;
drop policy if exists "Church managers update services" on public.church_services;
create policy "Church managers update services"
  on public.church_services for update
  to authenticated
  using (public.can_manage_church_operations(church_id))
  with check (public.can_manage_church_operations(church_id));

create policy "Church managers delete services"
  on public.church_services for delete
  to authenticated
  using (public.can_manage_church_operations(church_id));

drop policy if exists "Church analytics readable by operators" on public.church_analytics_snapshots;
create policy "Church analytics readable by managers"
  on public.church_analytics_snapshots for select
  to authenticated
  using (public.can_manage_church_operations(church_id));

drop policy if exists "Church managers create analytics snapshots" on public.church_analytics_snapshots;
create policy "Church managers create analytics snapshots"
  on public.church_analytics_snapshots for insert
  to authenticated
  with check (public.can_manage_church_operations(church_id));

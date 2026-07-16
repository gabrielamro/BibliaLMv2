-- Modulo independente de Gestao da Igreja.
-- Execute no Supabase SQL Editor depois de create_churches.sql.
-- Desenho de baixo custo: tokens indexados, listas paginaveis e resumos por status.

create extension if not exists pgcrypto;

-- Garantir que colunas novas existam caso as tabelas tenham sido criadas em migrações anteriores
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'church_assignments') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'church_assignments' and column_name = 'source_type') then
      alter table public.church_assignments add column source_type text null;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'church_assignments' and column_name = 'source_id') then
      alter table public.church_assignments add column source_id text null;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'church_form_submissions') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'church_form_submissions' and column_name = 'source_type') then
      alter table public.church_form_submissions add column source_type text null;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'church_form_submissions' and column_name = 'source_id') then
      alter table public.church_form_submissions add column source_id text null;
    end if;
  end if;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.subscription_tier = 'admin'
        or profiles.username = 'gabrielamaro'
        or profiles.email = 'gabrielamaro@live.com'
      )
  );
$$;

create table if not exists public.church_member_roles (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('church_manager', 'pastor', 'leader', 'volunteer')),
  scope_type text not null default 'church' check (scope_type in ('church', 'team', 'group', 'service', 'event')),
  scope_id uuid null,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  granted_by uuid null references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  meta jsonb not null default '{}'::jsonb,
  unique (church_id, user_id, role, scope_type, scope_id)
);

create index if not exists church_member_roles_church_role_idx
  on public.church_member_roles (church_id, role, status);
create index if not exists church_member_roles_user_idx
  on public.church_member_roles (user_id, status);

create or replace function public.has_church_role(
  p_church_id uuid,
  p_roles text[],
  p_scope_type text default null,
  p_scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_platform_admin(), false)
    or exists (
      select 1
      from public.churches c
      where c.id = p_church_id
        and auth.uid() = any(c.admins)
    )
    or exists (
      select 1
      from public.church_role_requests rr
      where rr.church_id = p_church_id
        and rr.user_id = auth.uid()
        and rr.status = 'approved'
        and (
          rr.requested_role = 'admin'
          or (rr.requested_role = 'pastor' and 'pastor' = any(p_roles))
        )
    )
    or exists (
      select 1
      from public.church_member_roles r
      where r.church_id = p_church_id
        and r.user_id = auth.uid()
        and r.role = any(p_roles)
        and r.status = 'active'
        and (
          p_scope_type is null
          or r.scope_type = 'church'
          or (r.scope_type = p_scope_type and (p_scope_id is null or r.scope_id = p_scope_id))
        )
    );
$$;

create or replace function public.can_manage_church_operations(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_church_role(p_church_id, array['church_manager']);
$$;

create or replace function public.can_manage_church_care(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_church_role(p_church_id, array['pastor']);
$$;

create table if not exists public.church_service_teams (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  slug text not null,
  area text not null,
  description text not null default '',
  leader_id uuid null references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  capacity integer null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, slug)
);

create index if not exists church_service_teams_church_status_idx
  on public.church_service_teams (church_id, status, created_at desc);
create index if not exists church_service_teams_leader_idx
  on public.church_service_teams (leader_id) where leader_id is not null;

create table if not exists public.church_assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  team_id uuid null references public.church_service_teams(id) on delete set null,
  title text not null,
  description text not null default '',
  assignee_user_id uuid null references auth.users(id) on delete set null,
  leader_user_id uuid null references auth.users(id) on delete set null,
  scope_type text not null default 'church' check (scope_type in ('church', 'team', 'group', 'service', 'event')),
  scope_id uuid null,
  status text not null default 'pending' check (status in ('draft', 'pending', 'accepted', 'declined', 'paused', 'expired', 'removed')),
  requires_acceptance boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  public_feedback text not null default '',
  created_by uuid null references auth.users(id) on delete set null,
  source_type text null,
  source_id text null,
  accepted_at timestamptz null,
  declined_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_assignments_church_status_idx
  on public.church_assignments (church_id, status, created_at desc);
create index if not exists church_assignments_assignee_idx
  on public.church_assignments (assignee_user_id, status, starts_at);
create index if not exists church_assignments_team_idx
  on public.church_assignments (team_id, status);
create unique index if not exists church_assignments_source_idx
  on public.church_assignments (church_id, source_type, source_id)
  where source_type is not null and source_id is not null;

create table if not exists public.church_qr_forms (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  token text not null unique,
  title text not null,
  form_type text not null check (form_type in ('prayer', 'volunteer', 'visitor', 'pastor_care', 'group', 'custom')),
  description text not null default '',
  fields jsonb not null default '[]'::jsonb,
  destination text not null default 'inbox',
  privacy_text text not null default '',
  confirmation_text text not null default '',
  allow_anonymous boolean not null default true,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'expired', 'archived')),
  scans_count integer not null default 0,
  submissions_count integer not null default 0,
  expires_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_qr_forms_church_status_idx
  on public.church_qr_forms (church_id, status, created_at desc);
create index if not exists church_qr_forms_token_idx
  on public.church_qr_forms (token);

create or replace function public.increment_church_qr_counter(
  p_form_id uuid,
  p_counter text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_counter = 'scan' then
    update public.church_qr_forms
      set scans_count = scans_count + 1,
          updated_at = now()
      where id = p_form_id
        and status = 'active'
        and (expires_at is null or expires_at > now());
  elsif p_counter = 'submission' then
    update public.church_qr_forms
      set submissions_count = submissions_count + 1,
          updated_at = now()
      where id = p_form_id
        and status = 'active'
        and (expires_at is null or expires_at > now());
  else
    raise exception 'Unsupported church QR counter: %', p_counter;
  end if;
end;
$$;

create table if not exists public.church_form_submissions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  form_id uuid null references public.church_qr_forms(id) on delete set null,
  form_type text not null,
  submitter_user_id uuid null references auth.users(id) on delete set null,
  submitter_name text null,
  submitter_contact text null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status in ('received', 'assigned', 'in_progress', 'waiting_member', 'answered', 'closed', 'archived')),
  public_status text not null default 'Recebido pela igreja',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid null references auth.users(id) on delete set null,
  is_sensitive boolean not null default false,
  public_feedback text not null default '',
  internal_summary text not null default '',
  next_action text not null default '',
  source_type text null,
  source_id text null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_form_submissions_church_status_idx
  on public.church_form_submissions (church_id, status, created_at desc);
create index if not exists church_form_submissions_assigned_idx
  on public.church_form_submissions (assigned_to, status, created_at desc);
create index if not exists church_form_submissions_submitter_idx
  on public.church_form_submissions (submitter_user_id, created_at desc)
  where submitter_user_id is not null;
create index if not exists church_form_submissions_form_idx
  on public.church_form_submissions (form_id, created_at desc);
create unique index if not exists church_form_submissions_source_idx
  on public.church_form_submissions (church_id, source_type, source_id)
  where source_type is not null and source_id is not null;

create table if not exists public.church_management_notifications (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete cascade,
  audience_role text null,
  title text not null,
  message text not null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'action', 'urgent')),
  channel text not null default 'dashboard' check (channel in ('dashboard', 'member', 'both')),
  link text null,
  dedupe_key text null,
  read_at timestamptz null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists church_management_notifications_user_idx
  on public.church_management_notifications (user_id, read_at, created_at desc)
  where user_id is not null;
create index if not exists church_management_notifications_church_idx
  on public.church_management_notifications (church_id, severity, created_at desc);
create unique index if not exists church_management_notifications_dedupe_idx
  on public.church_management_notifications (church_id, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), dedupe_key)
  where dedupe_key is not null;

create table if not exists public.church_notification_events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete cascade,
  audience_role text null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'action', 'urgent')),
  channel text not null default 'dashboard' check (channel in ('dashboard', 'member', 'both')),
  source_type text null,
  source_id text null,
  dedupe_key text null,
  status text not null default 'queued' check (status in ('queued', 'notified', 'dismissed', 'muted')),
  notification_id uuid null references public.church_management_notifications(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists church_notification_events_church_idx
  on public.church_notification_events (church_id, status, severity, created_at desc);
create index if not exists church_notification_events_user_idx
  on public.church_notification_events (user_id, status, created_at desc)
  where user_id is not null;
create unique index if not exists church_notification_events_dedupe_idx
  on public.church_notification_events (church_id, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), dedupe_key)
  where dedupe_key is not null;

create or replace function public.notify_church_form_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.church_form_submissions%rowtype;
  v_form public.church_qr_forms%rowtype;
  v_audience_role text;
  v_severity text;
  v_dedupe_key text;
  v_notification_id uuid;
begin
  select * into v_submission
  from public.church_form_submissions
  where id = p_submission_id;

  if not found then
    return;
  end if;

  select * into v_form
  from public.church_qr_forms
  where id = v_submission.form_id
    and church_id = v_submission.church_id
    and status = 'active';

  if not found then
    return;
  end if;

  v_audience_role := case
    when v_submission.form_type in ('prayer', 'pastor_care') then 'pastor'
    else 'leader'
  end;
  v_severity := case
    when v_submission.form_type in ('prayer', 'pastor_care') then 'urgent'
    else 'action'
  end;
  v_dedupe_key := 'submission_created:' || v_submission.id::text;

  insert into public.church_notification_events (
    church_id,
    audience_role,
    event_type,
    severity,
    channel,
    source_type,
    source_id,
    dedupe_key,
    payload
  )
  values (
    v_submission.church_id,
    v_audience_role,
    'submission_created',
    v_severity,
    'dashboard',
    'form_submission',
    v_submission.id::text,
    v_dedupe_key,
    jsonb_build_object('formId', v_form.id, 'formType', v_submission.form_type)
  )
  on conflict do nothing;

  insert into public.church_management_notifications (
    church_id,
    audience_role,
    title,
    message,
    event_type,
    severity,
    channel,
    link,
    dedupe_key
  )
  values (
    v_submission.church_id,
    v_audience_role,
    'Novo pedido recebido',
    v_form.title || ' recebeu uma nova resposta pelo QR publico.',
    'submission_created',
    v_severity,
    'dashboard',
    '/gestao-igreja/inbox',
    v_dedupe_key
  )
  on conflict do nothing
  returning id into v_notification_id;

  update public.church_notification_events
  set status = 'notified',
      notification_id = coalesce(v_notification_id, notification_id)
  where church_id = v_submission.church_id
    and dedupe_key = v_dedupe_key;
end;
$$;

create table if not exists public.church_volunteer_badges (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  title text not null,
  description text not null default '',
  mana_amount integer not null default 0,
  visibility text not null default 'private' check (visibility in ('private', 'team', 'church')),
  source_type text not null default 'manual',
  source_id uuid null,
  awarded_by uuid null references auth.users(id) on delete set null,
  awarded_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  unique (church_id, user_id, badge_key, source_type, source_id)
);

create index if not exists church_volunteer_badges_user_idx
  on public.church_volunteer_badges (user_id, awarded_at desc);
create index if not exists church_volunteer_badges_church_idx
  on public.church_volunteer_badges (church_id, awarded_at desc);

create table if not exists public.church_management_settings (
  church_id uuid primary key references public.churches(id) on delete cascade,
  qr_default_validity_days integer not null default 30 check (qr_default_validity_days between 1 and 365),
  default_privacy_text text not null default 'As informacoes enviadas serao tratadas pela equipe autorizada da igreja.',
  default_confirmation_text text not null default 'Recebemos seu envio. A igreja dara retorno quando houver proximo passo publico.',
  notify_pastors_on_sensitive_requests boolean not null default true,
  notify_leaders_on_volunteer_requests boolean not null default true,
  member_feedback_enabled boolean not null default true,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.church_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  period_key text not null,
  members_count integer not null default 0,
  active_members_count integer not null default 0,
  visitors_count integer not null default 0,
  new_members_count integer not null default 0,
  prayer_requests_count integer not null default 0,
  care_items_open_count integer not null default 0,
  care_items_overdue_count integer not null default 0,
  volunteer_applications_count integer not null default 0,
  active_volunteers_count integer not null default 0,
  services_count integer not null default 0,
  checkins_count integer not null default 0,
  groups_count integer not null default 0,
  active_groups_count integer not null default 0,
  forms_submissions_count integer not null default 0,
  qr_scans_count integer not null default 0,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (church_id, period_key)
);

create index if not exists church_analytics_snapshots_church_period_idx
  on public.church_analytics_snapshots (church_id, period_key desc);

alter table public.church_member_roles enable row level security;
alter table public.church_service_teams enable row level security;
alter table public.church_assignments enable row level security;
alter table public.church_qr_forms enable row level security;
alter table public.church_form_submissions enable row level security;
alter table public.church_management_notifications enable row level security;
alter table public.church_notification_events enable row level security;
alter table public.church_volunteer_badges enable row level security;
alter table public.church_management_settings enable row level security;
alter table public.church_analytics_snapshots enable row level security;

drop policy if exists "Church roles readable by church operators and self" on public.church_member_roles;
create policy "Church roles readable by church operators and self"
  on public.church_member_roles for select
  using (
    user_id = auth.uid()
    or public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
  );

drop policy if exists "Church managers manage roles" on public.church_member_roles;
create policy "Church managers manage roles"
  on public.church_member_roles for all
  using (public.can_manage_church_operations(church_id))
  with check (public.can_manage_church_operations(church_id));

drop policy if exists "Church teams readable by members" on public.church_service_teams;
create policy "Church teams readable by members"
  on public.church_service_teams for select
  using (
    public.has_church_role(church_id, array['church_manager', 'pastor', 'leader', 'volunteer'])
    or exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.church_id = church_service_teams.church_id)
  );

drop policy if exists "Church managers and leaders manage teams" on public.church_service_teams;
drop policy if exists "Church operators create teams" on public.church_service_teams;
drop policy if exists "Church operators update teams" on public.church_service_teams;
drop policy if exists "Church operators delete teams" on public.church_service_teams;

create policy "Church operators create teams"
  on public.church_service_teams for insert
  with check (
    public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'])
  );

create policy "Church operators update teams"
  on public.church_service_teams for update
  using (
    public.has_church_role(church_id, array['church_manager', 'pastor'])
    or public.has_church_role(church_id, array['leader'], 'team', id)
  )
  with check (
    public.has_church_role(church_id, array['church_manager', 'pastor'])
    or public.has_church_role(church_id, array['leader'], 'team', id)
  );

create policy "Church operators delete teams"
  on public.church_service_teams for delete
  using (
    public.has_church_role(church_id, array['church_manager', 'pastor'])
    or public.has_church_role(church_id, array['leader'], 'team', id)
  );

drop policy if exists "Assignments readable by operators leaders and assignee" on public.church_assignments;
create policy "Assignments readable by operators leaders and assignee"
  on public.church_assignments for select
  using (
    assignee_user_id = auth.uid()
    or leader_user_id = auth.uid()
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'], scope_type, scope_id)
  );

drop policy if exists "Operators and leaders manage assignments" on public.church_assignments;
create policy "Operators and leaders manage assignments"
  on public.church_assignments for insert
  with check (public.has_church_role(church_id, array['church_manager', 'leader'], scope_type, scope_id));

drop policy if exists "Operators leaders and assignee update assignments" on public.church_assignments;
create policy "Operators leaders and assignee update assignments"
  on public.church_assignments for update
  using (
    assignee_user_id = auth.uid()
    or public.has_church_role(church_id, array['church_manager', 'leader'], scope_type, scope_id)
  )
  with check (
    assignee_user_id = auth.uid()
    or public.has_church_role(church_id, array['church_manager', 'leader'], scope_type, scope_id)
  );

drop policy if exists "Active QR forms public by token" on public.church_qr_forms;
create policy "Active QR forms public by token"
  on public.church_qr_forms for select
  using (status = 'active' and (expires_at is null or expires_at > now()));

drop policy if exists "Church operators manage QR forms" on public.church_qr_forms;
create policy "Church operators manage QR forms"
  on public.church_qr_forms for all
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader']))
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader']));

drop policy if exists "Public can create active form submissions" on public.church_form_submissions;
create policy "Public can create active form submissions"
  on public.church_form_submissions for insert
  with check (
    exists (
      select 1
      from public.church_qr_forms f
      where f.id = church_form_submissions.form_id
        and f.church_id = church_form_submissions.church_id
        and f.form_type = church_form_submissions.form_type
        and f.status = 'active'
        and (f.expires_at is null or f.expires_at > now())
        and (
          f.form_type <> 'volunteer'
          or (
            auth.uid() is not null
            and church_form_submissions.submitter_user_id = auth.uid()
            and exists (
              select 1
              from public.memberships m
              where m.user_id = auth.uid()
                and m.church_id = church_form_submissions.church_id
            )
          )
        )
    )
  );

drop policy if exists "Submissions readable by self or authorized church roles" on public.church_form_submissions;
create policy "Submissions readable by self or authorized church roles"
  on public.church_form_submissions for select
  using (
    submitter_user_id = auth.uid()
    or (
      is_sensitive = false
      and public.can_manage_church_operations(church_id)
    )
    or public.can_manage_church_care(church_id)
    or assigned_to = auth.uid()
  );

drop policy if exists "Authorized users update submissions" on public.church_form_submissions;
create policy "Authorized users update submissions"
  on public.church_form_submissions for update
  using (
    public.can_manage_church_care(church_id)
    or (is_sensitive = false and public.can_manage_church_operations(church_id))
    or assigned_to = auth.uid()
  )
  with check (
    public.can_manage_church_care(church_id)
    or (is_sensitive = false and public.can_manage_church_operations(church_id))
    or assigned_to = auth.uid()
  );

drop policy if exists "Notifications readable by recipient or church operators" on public.church_management_notifications;
create policy "Notifications readable by recipient or church operators"
  on public.church_management_notifications for select
  using (
    user_id = auth.uid()
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'])
  );

drop policy if exists "Church operators create notifications" on public.church_management_notifications;
create policy "Church operators create notifications"
  on public.church_management_notifications for insert
  with check (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader']));

drop policy if exists "Recipients update own notifications" on public.church_management_notifications;
create policy "Recipients update own notifications"
  on public.church_management_notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Church operators update dashboard notifications" on public.church_management_notifications;
create policy "Church operators update dashboard notifications"
  on public.church_management_notifications for update
  using (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
  );

drop policy if exists "Notification events readable by recipient or church operators" on public.church_notification_events;
create policy "Notification events readable by recipient or church operators"
  on public.church_notification_events for select
  using (
    user_id = auth.uid()
    or public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
  );

drop policy if exists "Church operators create notification events" on public.church_notification_events;
create policy "Church operators create notification events"
  on public.church_notification_events for insert
  with check (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
    or user_id = auth.uid()
  );

drop policy if exists "Church operators update notification events" on public.church_notification_events;
create policy "Church operators update notification events"
  on public.church_notification_events for update
  using (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
    or user_id = auth.uid()
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
    or user_id = auth.uid()
  );

drop policy if exists "Badges readable by user and church roles" on public.church_volunteer_badges;
create policy "Badges readable by user and church roles"
  on public.church_volunteer_badges for select
  using (
    user_id = auth.uid()
    or public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'])
  );

drop policy if exists "Church operators award badges" on public.church_volunteer_badges;
create policy "Church operators award badges"
  on public.church_volunteer_badges for insert
  with check (public.has_church_role(church_id, array['church_manager', 'leader']));

drop policy if exists "Assignees record accepted assignment badges" on public.church_volunteer_badges;
create policy "Assignees record accepted assignment badges"
  on public.church_volunteer_badges for insert
  with check (
    user_id = auth.uid()
    and badge_key = 'assignment_accepted'
    and source_type = 'assignment'
    and source_id is not null
    and exists (
      select 1
      from public.church_assignments a
      where a.id = church_volunteer_badges.source_id
        and a.church_id = church_volunteer_badges.church_id
        and a.assignee_user_id = auth.uid()
        and a.status = 'accepted'
    )
  );

drop policy if exists "Church settings readable by operators" on public.church_management_settings;
create policy "Church settings readable by operators"
  on public.church_management_settings for select
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader']));

drop policy if exists "Church managers manage settings" on public.church_management_settings;
create policy "Church managers manage settings"
  on public.church_management_settings for all
  using (public.can_manage_church_operations(church_id))
  with check (public.can_manage_church_operations(church_id));

drop policy if exists "Church analytics readable by operators" on public.church_analytics_snapshots;
create policy "Church analytics readable by operators"
  on public.church_analytics_snapshots for select
  using (public.has_church_role(church_id, array['church_manager', 'pastor', 'leader']));

drop policy if exists "Church managers create analytics snapshots" on public.church_analytics_snapshots;
create policy "Church managers create analytics snapshots"
  on public.church_analytics_snapshots for insert
  with check (
    public.can_manage_church_operations(church_id)
    or public.can_manage_church_care(church_id)
  );

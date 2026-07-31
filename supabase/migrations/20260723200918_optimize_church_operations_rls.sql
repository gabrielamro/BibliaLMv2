-- Indices para as FKs usadas nas exclusoes/cascatas e consolidacao das
-- politicas permissivas sinalizadas pelo Performance Advisor.

create index church_team_functions_team_fk_idx
  on public.church_team_functions (team_id);
create index church_team_functions_created_by_idx
  on public.church_team_functions (created_by);

create index church_service_scale_slots_service_fk_idx
  on public.church_service_scale_slots (service_id);
create index church_service_scale_slots_team_fk_idx
  on public.church_service_scale_slots (team_id);
create index church_service_scale_slots_function_fk_idx
  on public.church_service_scale_slots (function_id);
create index church_service_scale_slots_created_by_idx
  on public.church_service_scale_slots (created_by);

create index church_service_invites_service_fk_idx
  on public.church_service_invites (service_id);
create index church_service_invites_team_fk_idx
  on public.church_service_invites (team_id);
create index church_service_invites_slot_fk_idx
  on public.church_service_invites (slot_id);
create index church_service_invites_assignment_fk_idx
  on public.church_service_invites (assignment_id);
create index church_service_invites_created_by_idx
  on public.church_service_invites (created_by);

create index church_participation_logs_service_fk_idx
  on public.church_participation_logs (service_id);
create index church_participation_logs_team_fk_idx
  on public.church_participation_logs (team_id);
create index church_participation_logs_assignment_fk_idx
  on public.church_participation_logs (assignment_id);
create index church_participation_logs_invite_fk_idx
  on public.church_participation_logs (invite_id);
create index church_participation_logs_user_fk_idx
  on public.church_participation_logs (user_id);
create index church_participation_logs_recorded_by_idx
  on public.church_participation_logs (recorded_by);

drop policy if exists "Team functions managed by scoped operators" on public.church_team_functions;
create policy "Scoped operators create team functions"
  on public.church_team_functions for insert
  to authenticated
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );
create policy "Scoped operators update team functions"
  on public.church_team_functions for update
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );
create policy "Scoped operators delete team functions"
  on public.church_team_functions for delete
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );

drop policy if exists "Scale slots managed by scoped operators" on public.church_service_scale_slots;
create policy "Scoped operators create scale slots"
  on public.church_service_scale_slots for insert
  to authenticated
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );
create policy "Scoped operators update scale slots"
  on public.church_service_scale_slots for update
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  )
  with check (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );
create policy "Scoped operators delete scale slots"
  on public.church_service_scale_slots for delete
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], 'team', team_id)
  );

drop policy if exists "Active QR forms public by token" on public.church_qr_forms;
drop policy if exists "Scoped roles manage QR forms" on public.church_qr_forms;
create policy "Anonymous users read active QR forms"
  on public.church_qr_forms for select
  to anon
  using (status = 'active' and (expires_at is null or expires_at > now()));
create policy "Authenticated users read allowed QR forms"
  on public.church_qr_forms for select
  to authenticated
  using (
    (status = 'active' and (expires_at is null or expires_at > now()))
    or public.can_manage_church_operations(church_id)
    or (form_type in ('prayer', 'pastor_care') and public.can_manage_church_care(church_id))
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  );
create policy "Scoped roles create QR forms"
  on public.church_qr_forms for insert
  to authenticated
  with check (
    public.can_manage_church_operations(church_id)
    or (form_type in ('prayer', 'pastor_care') and public.can_manage_church_care(church_id))
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  );
create policy "Scoped roles update QR forms"
  on public.church_qr_forms for update
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or (form_type in ('prayer', 'pastor_care') and public.can_manage_church_care(church_id))
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  )
  with check (
    public.can_manage_church_operations(church_id)
    or (form_type in ('prayer', 'pastor_care') and public.can_manage_church_care(church_id))
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  );
create policy "Scoped roles delete QR forms"
  on public.church_qr_forms for delete
  to authenticated
  using (
    public.can_manage_church_operations(church_id)
    or (form_type in ('prayer', 'pastor_care') and public.can_manage_church_care(church_id))
    or (
      scope_type = 'team'
      and scope_id is not null
      and public.has_church_role(church_id, array['leader'], 'team', scope_id)
    )
  );

drop policy if exists "Authors can read own church services" on public.church_services;
drop policy if exists "Public can read published church services" on public.church_services;
create policy "Anonymous users read published church services"
  on public.church_services for select
  to anon
  using (status in ('published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived'));
create policy "Authenticated users read allowed church services"
  on public.church_services for select
  to authenticated
  using (
    status in ('published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived')
    or created_by = (select auth.uid())
    or public.can_manage_church_operations(church_id)
  );

drop policy if exists "Operators leaders and assignee update assignments" on public.church_assignments;
create policy "Scoped operators and assignee update assignments"
  on public.church_assignments for update
  to authenticated
  using (
    assignee_user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], scope_type, scope_id)
  )
  with check (
    assignee_user_id = (select auth.uid())
    or public.can_manage_church_operations(church_id)
    or public.has_church_role(church_id, array['leader'], scope_type, scope_id)
  );

-- RLS decide quais linhas podem ser alteradas; estes gatilhos impedem que o
-- proprio convidado transforme uma resposta em edicao administrativa.
create or replace function public.guard_assignment_assignee_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) = old.assignee_user_id
    and not public.can_manage_church_operations(old.church_id)
    and not public.has_church_role(old.church_id, array['leader'], old.scope_type, old.scope_id)
  then
    if (
      new.id,
      new.church_id,
      new.team_id,
      new.title,
      new.description,
      new.assignee_user_id,
      new.leader_user_id,
      new.scope_type,
      new.scope_id,
      new.requires_acceptance,
      new.starts_at,
      new.ends_at,
      new.created_by,
      new.source_type,
      new.source_id,
      new.created_at
    ) is distinct from (
      old.id,
      old.church_id,
      old.team_id,
      old.title,
      old.description,
      old.assignee_user_id,
      old.leader_user_id,
      old.scope_type,
      old.scope_id,
      old.requires_acceptance,
      old.starts_at,
      old.ends_at,
      old.created_by,
      old.source_type,
      old.source_id,
      old.created_at
    ) then
      raise exception 'O convidado pode apenas responder a propria designacao.';
    end if;
    if new.status not in ('pending', 'accepted', 'declined') then
      raise exception 'Status de resposta invalido para o convidado.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_assignment_assignee_update() from public;
drop trigger if exists guard_assignment_assignee_update_trigger on public.church_assignments;
create trigger guard_assignment_assignee_update_trigger
before update on public.church_assignments
for each row execute function public.guard_assignment_assignee_update();

create or replace function public.guard_service_invite_assignee_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) = old.user_id
    and not public.can_manage_church_operations(old.church_id)
    and not (
      old.team_id is not null
      and public.has_church_role(old.church_id, array['leader'], 'team', old.team_id)
    )
  then
    if (
      new.id,
      new.church_id,
      new.service_id,
      new.team_id,
      new.slot_id,
      new.assignment_id,
      new.user_id,
      new.role,
      new.sent_at,
      new.expires_at,
      new.created_by,
      new.created_at
    ) is distinct from (
      old.id,
      old.church_id,
      old.service_id,
      old.team_id,
      old.slot_id,
      old.assignment_id,
      old.user_id,
      old.role,
      old.sent_at,
      old.expires_at,
      old.created_by,
      old.created_at
    ) then
      raise exception 'O convidado pode apenas responder ao proprio convite.';
    end if;
    if new.status not in ('pending', 'confirmed', 'declined', 'conflict') then
      raise exception 'Status de resposta invalido para o convidado.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_service_invite_assignee_update() from public;
drop trigger if exists guard_service_invite_assignee_update_trigger on public.church_service_invites;
create trigger guard_service_invite_assignee_update_trigger
before update on public.church_service_invites
for each row execute function public.guard_service_invite_assignee_update();

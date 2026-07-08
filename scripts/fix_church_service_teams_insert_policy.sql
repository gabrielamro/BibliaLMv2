-- Corrige INSERT em church_service_teams.
-- A policy anterior usava has_church_role(church_id, ..., 'team', id) tambem no INSERT.
-- Para uma equipe nova, ainda nao existe escopo de time concedido para aquele id,
-- entao a RLS pode bloquear a criacao antes da equipe existir.

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

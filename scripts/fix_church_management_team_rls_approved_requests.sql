-- Corrige acesso de gestores aprovados ao modulo Gestao da Igreja.
-- Sintoma: insert em church_service_teams falha com RLS 42501 para usuario aprovado
-- em church_role_requests, mas ainda sem role operacional ou sem registro em churches.admins.

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

-- Backfill para igrejas aprovadas antes da promocao automatica atualizar churches.admins.
update public.churches c
set admins = (
  select array(
    select distinct admin_id
    from unnest(coalesce(c.admins, '{}'::uuid[])) as existing(admin_id)
    union
    select rr.user_id
    from public.church_role_requests rr
    where rr.church_id = c.id
      and rr.status = 'approved'
      and rr.requested_role = 'admin'
  )
),
updated_at = now()
where exists (
  select 1
  from public.church_role_requests rr
  where rr.church_id = c.id
    and rr.status = 'approved'
    and rr.requested_role = 'admin'
    and not (rr.user_id = any(coalesce(c.admins, '{}'::uuid[])))
);

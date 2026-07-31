-- Igreja, membership e papel operacional são relações independentes.
-- Grupos e subgrupos só podem ser criados por pastor/líder ativo da mesma igreja.

create index if not exists church_member_roles_group_capability_idx
  on public.church_member_roles (church_id, user_id, role, status, scope_type, scope_id);

create index if not exists memberships_church_cell_user_idx
  on public.memberships (church_id, cell_id, user_id);

create index if not exists cells_church_parent_privacy_idx
  on public.cells (church_id, parent_group_id, privacy);

create or replace function public.is_current_user_church_member(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.memberships membership
      where membership.user_id = (select auth.uid())
        and membership.church_id = p_church_id
    );
$$;

create or replace function public.can_create_church_group(
  p_church_id uuid,
  p_parent_group_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_user_church_member(p_church_id)
    and (
      p_parent_group_id is null
      or exists (
        select 1
        from public.cells parent_group
        where parent_group.id = p_parent_group_id
          and parent_group.church_id = p_church_id
      )
    )
    and exists (
      select 1
      from public.church_member_roles role_assignment
      where role_assignment.church_id = p_church_id
        and role_assignment.user_id = (select auth.uid())
        and role_assignment.status = 'active'
        and (
          role_assignment.role = 'pastor'
          or (
            role_assignment.role = 'leader'
            and (
              (p_parent_group_id is null and role_assignment.scope_type = 'church')
              or (
                p_parent_group_id is not null
                and (
                  role_assignment.scope_type = 'church'
                  or (
                    role_assignment.scope_type = 'group'
                    and role_assignment.scope_id = p_parent_group_id
                  )
                )
              )
            )
          )
        )
    );
$$;

create or replace function public.can_manage_church_group(
  p_church_id uuid,
  p_group_id uuid,
  p_parent_group_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_user_church_member(p_church_id)
    and exists (
      select 1
      from public.church_member_roles role_assignment
      where role_assignment.church_id = p_church_id
        and role_assignment.user_id = (select auth.uid())
        and role_assignment.status = 'active'
        and (
          role_assignment.role = 'pastor'
          or (
            role_assignment.role = 'leader'
            and (
              role_assignment.scope_type = 'church'
              or (
                role_assignment.scope_type = 'group'
                and role_assignment.scope_id in (p_group_id, p_parent_group_id)
              )
            )
          )
        )
    );
$$;

create or replace function public.is_valid_church_group_leader(
  p_church_id uuid,
  p_leader_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_leader_id is null
    or (
      exists (
        select 1
        from public.memberships membership
        where membership.user_id = p_leader_id
          and membership.church_id = p_church_id
      )
      and exists (
        select 1
        from public.church_member_roles role_assignment
        where role_assignment.user_id = p_leader_id
          and role_assignment.church_id = p_church_id
          and role_assignment.status = 'active'
          and role_assignment.role in ('pastor', 'leader')
      )
    );
$$;

create or replace function public.can_view_church_group(
  p_church_id uuid,
  p_group_id uuid,
  p_privacy text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_privacy = 'public'
    or public.is_current_user_church_member(p_church_id)
    or exists (
      select 1
      from public.group_access_invites invite
      where invite.group_id = p_group_id
        and invite.invited_user_id = (select auth.uid())
        and invite.status = 'pending'
        and (invite.expires_at is null or invite.expires_at > now())
    );
$$;

create or replace function public.can_view_church_group_content(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cells church_group
    where church_group.id = p_group_id
      and (
        church_group.privacy = 'public'
        or exists (
          select 1
          from public.memberships membership
          where membership.user_id = (select auth.uid())
            and membership.church_id = church_group.church_id
            and membership.cell_id = church_group.id
        )
        or public.can_manage_church_group(
          church_group.church_id,
          church_group.id,
          church_group.parent_group_id
        )
      )
  );
$$;

create or replace function public.can_post_church_group_content(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cells church_group
    where church_group.id = p_group_id
      and (
        exists (
          select 1
          from public.memberships membership
          where membership.user_id = (select auth.uid())
            and membership.church_id = church_group.church_id
            and membership.cell_id = church_group.id
        )
        or public.can_manage_church_group(
          church_group.church_id,
          church_group.id,
          church_group.parent_group_id
        )
      )
  );
$$;

revoke all on function public.is_current_user_church_member(uuid) from public;
revoke all on function public.can_create_church_group(uuid, uuid) from public;
revoke all on function public.can_manage_church_group(uuid, uuid, uuid) from public;
revoke all on function public.is_valid_church_group_leader(uuid, uuid) from public;
revoke all on function public.can_view_church_group(uuid, uuid, text) from public;
revoke all on function public.can_view_church_group_content(uuid) from public;
revoke all on function public.can_post_church_group_content(uuid) from public;

grant execute on function public.is_current_user_church_member(uuid) to authenticated;
grant execute on function public.can_create_church_group(uuid, uuid) to authenticated;
grant execute on function public.can_manage_church_group(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_valid_church_group_leader(uuid, uuid) to authenticated;
grant execute on function public.can_view_church_group(uuid, uuid, text) to anon, authenticated;
grant execute on function public.can_view_church_group_content(uuid) to anon, authenticated;
grant execute on function public.can_post_church_group_content(uuid) to authenticated;

alter table public.cells enable row level security;
grant select on public.cells to anon, authenticated;
grant insert, update, delete on public.cells to authenticated;

drop policy if exists "Users can read church groups" on public.cells;
drop policy if exists "Authenticated users can create church groups" on public.cells;
drop policy if exists "Group creators can update church groups" on public.cells;
drop policy if exists "Group creators can delete church groups" on public.cells;
drop policy if exists "Church groups follow privacy" on public.cells;
drop policy if exists "Pastors and scoped leaders create church groups" on public.cells;
drop policy if exists "Pastors and scoped leaders update church groups" on public.cells;
drop policy if exists "Pastors and scoped leaders delete church groups" on public.cells;

create policy "Church groups follow privacy"
  on public.cells
  for select
  to anon, authenticated
  using (public.can_view_church_group(church_id, id, privacy));

create policy "Pastors and scoped leaders create church groups"
  on public.cells
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_create_church_group(church_id, parent_group_id)
    and public.is_valid_church_group_leader(church_id, leader_id)
  );

create policy "Pastors and scoped leaders update church groups"
  on public.cells
  for update
  to authenticated
  using (public.can_manage_church_group(church_id, id, parent_group_id))
  with check (
    public.can_manage_church_group(church_id, id, parent_group_id)
    and public.is_valid_church_group_leader(church_id, leader_id)
  );

create policy "Pastors and scoped leaders delete church groups"
  on public.cells
  for delete
  to authenticated
  using (public.can_manage_church_group(church_id, id, parent_group_id));

alter table public.group_access_invites enable row level security;
grant select on public.group_access_invites to authenticated;
grant insert on public.group_access_invites to authenticated;

drop policy if exists "church members can create private group invites" on public.group_access_invites;
drop policy if exists "group leaders can create invites" on public.group_access_invites;
drop policy if exists "Pastors and scoped leaders create group invites" on public.group_access_invites;

create policy "Pastors and scoped leaders create group invites"
  on public.group_access_invites
  for insert
  to authenticated
  with check (
    invited_by_user_id = (select auth.uid())
    and exists (
      select 1
      from public.cells church_group
      where church_group.id = group_access_invites.group_id
        and church_group.church_id = group_access_invites.church_id
        and public.can_manage_church_group(
          church_group.church_id,
          church_group.id,
          church_group.parent_group_id
        )
    )
  );

create or replace function public.create_private_group_invite(
  p_group_id uuid,
  p_group_slug text,
  p_invited_user_id uuid,
  p_source text default 'invite',
  p_actor_name text default 'Um membro'
)
returns public.group_access_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_group public.cells;
  v_invite public.group_access_invites;
begin
  if v_actor_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '28000';
  end if;

  select * into v_group from public.cells where id = p_group_id;
  if v_group.id is null then
    raise exception 'Grupo nao encontrado.' using errcode = 'P0002';
  end if;
  if v_group.privacy <> 'private' then
    raise exception 'Convites de acesso sao exclusivos de grupos privados.' using errcode = '22023';
  end if;
  if not public.can_manage_church_group(v_group.church_id, v_group.id, v_group.parent_group_id) then
    raise exception 'Sem permissao para convidar para este grupo.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.memberships membership
    where membership.user_id = p_invited_user_id
      and membership.church_id = v_group.church_id
  ) then
    raise exception 'A pessoa convidada precisa ser membro desta igreja.' using errcode = '42501';
  end if;

  select * into v_invite
  from public.group_access_invites
  where group_id = p_group_id
    and invited_user_id = p_invited_user_id
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_invite.id is null then
    insert into public.group_access_invites (
      group_id, church_id, invited_user_id, invited_by_user_id,
      status, source, expires_at, created_at
    ) values (
      p_group_id, v_group.church_id, p_invited_user_id, v_actor_id,
      'pending', coalesce(nullif(p_source, ''), 'invite'), now() + interval '14 days', now()
    ) returning * into v_invite;
  end if;

  insert into public.notifications (user_id, title, message, type, link, timestamp, read)
  values (
    p_invited_user_id,
    'Convite para grupo privado',
    coalesce(nullif(p_actor_name, ''), 'Um membro') || case
      when coalesce(nullif(p_source, ''), 'invite') = 'mention'
        then ' marcou voce para acessar '
      else ' convidou voce para participar de '
    end || v_group.name || '.',
    'social',
    '/grupo/' || v_group.slug || '?invite=' || v_invite.id::text,
    now(),
    false
  );

  return v_invite;
end;
$$;

create or replace function public.accept_private_group_invite(p_invite_id uuid)
returns public.cells
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.group_access_invites;
  v_group public.cells;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '28000';
  end if;

  select * into v_invite
  from public.group_access_invites
  where id = p_invite_id
    and invited_user_id = v_user_id
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  for update;

  if v_invite.id is null then
    raise exception 'Convite invalido, expirado ou ja utilizado.' using errcode = 'P0002';
  end if;

  select * into v_group from public.cells where id = v_invite.group_id;
  if v_group.id is null then
    raise exception 'Grupo nao encontrado.' using errcode = 'P0002';
  end if;

  update public.memberships
  set cell_id = v_invite.group_id
  where user_id = v_user_id
    and church_id = v_invite.church_id;

  if not found then
    raise exception 'Voce precisa ser membro desta igreja antes de entrar no grupo.' using errcode = '42501';
  end if;

  update public.group_access_invites
  set status = 'accepted', accepted_at = now()
  where id = p_invite_id;

  return v_group;
end;
$$;

revoke all on function public.create_private_group_invite(uuid, text, uuid, text, text) from public;
revoke all on function public.accept_private_group_invite(uuid) from public;
grant execute on function public.create_private_group_invite(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.accept_private_group_invite(uuid) to authenticated;

alter table public.prayer_requests enable row level security;
grant select, insert, update, delete on public.prayer_requests to authenticated;
grant select on public.prayer_requests to anon;

drop policy if exists "Users can read prayer requests" on public.prayer_requests;
drop policy if exists "Prayer requests follow their audience" on public.prayer_requests;
drop policy if exists "Users can create own prayer requests" on public.prayer_requests;
drop policy if exists "Users create prayer requests inside their audience" on public.prayer_requests;

create policy "Prayer requests follow their audience"
  on public.prayer_requests
  for select
  to anon, authenticated
  using (
    target_type = 'global'
    or (
      target_type = 'church'
      and public.is_current_user_church_member(coalesce(church_id, target_id))
    )
    or (
      target_type = 'cell'
      and public.can_view_church_group_content(target_id)
    )
  );

create policy "Users create prayer requests inside their audience"
  on public.prayer_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      target_type = 'global'
      or (
        target_type = 'church'
        and public.is_current_user_church_member(coalesce(church_id, target_id))
      )
      or (
        target_type = 'cell'
        and public.can_post_church_group_content(target_id)
      )
    )
  );

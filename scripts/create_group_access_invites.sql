alter table public.cells
  add column if not exists privacy text not null default 'public'
  check (privacy in ('public', 'private'));

create table if not exists public.group_access_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.cells(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  source text not null default 'invite' check (source in ('invite', 'mention')),
  token text unique,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists group_access_invites_one_pending
  on public.group_access_invites(group_id, invited_user_id)
  where status = 'pending';

create index if not exists group_access_invites_invited_user_idx
  on public.group_access_invites(invited_user_id, status, created_at desc);

alter table public.group_access_invites enable row level security;

drop policy if exists "group invite recipients can read their invites"
  on public.group_access_invites;
create policy "group invite recipients can read their invites"
  on public.group_access_invites
  for select
  using (auth.uid() = invited_user_id);

drop policy if exists "group leaders can create invites"
  on public.group_access_invites;
drop policy if exists "church members can create private group invites"
  on public.group_access_invites;
create policy "church members can create private group invites"
  on public.group_access_invites
  for insert
  with check (
    auth.uid() = invited_by_user_id
    and exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.church_id = group_access_invites.church_id
    )
  );

drop policy if exists "group invite recipients can accept their invites"
  on public.group_access_invites;
create policy "group invite recipients can accept their invites"
  on public.group_access_invites
  for update
  using (auth.uid() = invited_user_id)
  with check (auth.uid() = invited_user_id);

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
  v_group record;
  v_invite public.group_access_invites;
begin
  if v_actor_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '28000';
  end if;

  select c.id, c.church_id, c.name
    into v_group
    from public.cells c
   where c.id = p_group_id;

  if v_group.id is null then
    raise exception 'Grupo nao encontrado.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
      from public.memberships m
     where m.user_id = v_actor_id
       and m.church_id = v_group.church_id
  ) and not exists (
    select 1
      from public.churches ch
     where ch.id = v_group.church_id
       and v_actor_id = any(ch.admins)
  ) then
    raise exception 'Sem permissao para convidar para este grupo.' using errcode = '42501';
  end if;

  select *
    into v_invite
    from public.group_access_invites
   where group_id = p_group_id
     and invited_user_id = p_invited_user_id
     and status = 'pending'
   limit 1;

  if v_invite.id is null then
    insert into public.group_access_invites (
      group_id,
      church_id,
      invited_user_id,
      invited_by_user_id,
      status,
      source,
      created_at
    )
    values (
      p_group_id,
      v_group.church_id,
      p_invited_user_id,
      v_actor_id,
      'pending',
      coalesce(nullif(p_source, ''), 'invite'),
      now()
    )
    returning * into v_invite;
  end if;

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    link,
    timestamp,
    read
  )
  values (
    p_invited_user_id,
    'Convite para grupo privado',
    coalesce(nullif(p_actor_name, ''), 'Um membro') || case
      when coalesce(nullif(p_source, ''), 'invite') = 'mention'
        then ' marcou voce para acessar '
      else ' convidou voce para participar de '
    end || v_group.name || '.',
    'social',
    '/grupo/' || p_group_id::text || '?invite=' || v_invite.id::text,
    now(),
    false
  );

  return v_invite;
end;
$$;

grant execute on function public.create_private_group_invite(uuid, text, uuid, text, text) to authenticated;

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

  select *
    into v_invite
    from public.group_access_invites
   where id = p_invite_id
     and invited_user_id = v_user_id
     and status = 'pending';

  if v_invite.id is null then
    raise exception 'Convite invalido, expirado ou ja utilizado.' using errcode = 'P0002';
  end if;

  select *
    into v_group
    from public.cells
   where id = v_invite.group_id;

  if v_group.id is null then
    raise exception 'Grupo nao encontrado.' using errcode = 'P0002';
  end if;

  insert into public.memberships (user_id, church_id, cell_id, role, joined_at)
  values (v_user_id, v_invite.church_id, v_invite.group_id, 'member', now())
  on conflict do nothing;

  update public.group_access_invites
     set status = 'accepted',
         accepted_at = now()
   where id = p_invite_id;

  return v_group;
end;
$$;

grant execute on function public.accept_private_group_invite(uuid) to authenticated;

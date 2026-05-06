-- Content privacy for studies and rooms.
-- Run this after the base studies/custom_plans tables exist.

alter table if exists studies
  add column if not exists privacy_level text default 'private',
  add column if not exists church_id uuid,
  add column if not exists group_id uuid,
  add column if not exists allowed_group_ids jsonb default '[]'::jsonb,
  add column if not exists allowed_user_ids jsonb default '[]'::jsonb,
  add column if not exists invite_required boolean default false,
  add column if not exists created_from_context text default 'user';

alter table if exists custom_plans
  add column if not exists privacy_level text default 'public',
  add column if not exists allowed_group_ids jsonb default '[]'::jsonb,
  add column if not exists allowed_user_ids jsonb default '[]'::jsonb,
  add column if not exists invite_required boolean default false,
  add column if not exists allow_pdf_download boolean default false,
  add column if not exists share_slug text,
  add column if not exists last_shared_at timestamptz,
  add column if not exists created_from_context text default 'user';

create table if not exists content_access_invites (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('study', 'room')),
  content_id text not null,
  invited_user_id uuid not null references profiles(id) on delete cascade,
  invited_by_user_id uuid not null references profiles(id) on delete cascade,
  church_id uuid null,
  group_id uuid null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  source text not null default 'invite' check (source in ('invite', 'mention', 'link')),
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  accepted_at timestamptz null,
  unique (content_type, content_id, invited_user_id, status)
);

alter table content_access_invites enable row level security;

drop policy if exists "content invite recipient can read" on content_access_invites;
create policy "content invite recipient can read"
  on content_access_invites for select
  using (auth.uid() = invited_user_id or auth.uid() = invited_by_user_id);

drop policy if exists "content invite recipient can update" on content_access_invites;
create policy "content invite recipient can update"
  on content_access_invites for update
  using (auth.uid() = invited_user_id)
  with check (auth.uid() = invited_user_id);

create or replace function create_content_access_invite(
  p_content_type text,
  p_content_id text,
  p_invited_user_id uuid,
  p_title text,
  p_actor_name text default 'Um membro',
  p_church_id uuid default null,
  p_group_id uuid default null,
  p_source text default 'invite'
) returns content_access_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite content_access_invites;
  v_link text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  insert into content_access_invites (
    content_type, content_id, invited_user_id, invited_by_user_id,
    church_id, group_id, source
  )
  values (
    p_content_type, p_content_id, p_invited_user_id, auth.uid(),
    p_church_id, p_group_id, coalesce(p_source, 'invite')
  )
  on conflict (content_type, content_id, invited_user_id, status)
  do update set
    invited_by_user_id = excluded.invited_by_user_id,
    church_id = excluded.church_id,
    group_id = excluded.group_id,
    source = excluded.source,
    created_at = now()
  returning * into v_invite;

  v_link := case
    when p_content_type = 'room' then '/jornada/' || p_content_id || '?invite=' || v_invite.id::text
    else '/v/' || p_content_id || '?invite=' || v_invite.id::text
  end;

  insert into notifications (user_id, title, message, type, link, timestamp, read)
  values (
    p_invited_user_id,
    'Convite para conteúdo',
    p_actor_name || ' convidou você para acessar ' || coalesce(p_title, 'um conteúdo privado') || '.',
    'content_invite',
    v_link,
    now(),
    false
  );

  return v_invite;
end;
$$;

create or replace function accept_content_access_invite(
  p_invite_id uuid
) returns content_access_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite content_access_invites;
begin
  update content_access_invites
  set status = 'accepted', accepted_at = now()
  where id = p_invite_id
    and invited_user_id = auth.uid()
    and status = 'pending'
  returning * into v_invite;

  if v_invite.id is null then
    raise exception 'Convite não encontrado ou já utilizado.';
  end if;

  return v_invite;
end;
$$;

grant execute on function create_content_access_invite(text, text, uuid, text, text, uuid, uuid, text) to authenticated;
grant execute on function accept_content_access_invite(uuid) to authenticated;

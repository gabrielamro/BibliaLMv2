-- Mana, niveis e rankings
-- Roadmap: docs/roadmaps/mana-expansao-niveis-rankings-roadmap.md

create table if not exists public.mana_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  church_id uuid null,
  group_id uuid null,
  actor_role text not null default 'user',
  action_type text not null,
  source_type text null,
  source_id text null,
  event_key text not null,
  xp_amount integer not null default 0,
  occurred_at timestamptz not null default now(),
  period_key text not null,
  status text not null default 'valid' check (status in ('valid', 'review', 'void')),
  void_reason text null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index if not exists mana_events_user_period_idx on public.mana_events (user_id, period_key);
create index if not exists mana_events_church_period_idx on public.mana_events (church_id, period_key) where church_id is not null;
create index if not exists mana_events_status_idx on public.mana_events (status);

create table if not exists public.gamification_rules (
  action_type text primary key,
  audience text not null default 'user',
  xp_amount integer not null default 0,
  daily_limit integer null,
  cooldown_seconds integer null,
  unique_key_strategy text not null default 'none',
  is_enabled boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gamification_levels (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  level_key text not null,
  name text not null,
  min_xp integer not null,
  max_xp integer null,
  description text not null default '',
  badge_id text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (audience, level_key)
);

create table if not exists public.gamification_badges (
  id text primary key,
  audience text not null default 'user',
  name text not null,
  description text not null default '',
  icon text not null default 'award',
  category text not null,
  requirement_type text null,
  requirement_value integer null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.church_gamification_snapshots (
  church_id uuid not null,
  period_key text not null,
  total_xp integer not null default 0,
  active_members integer not null default 0,
  xp_per_active_member numeric not null default 0,
  chapters_read integer not null default 0,
  devotionals_completed integer not null default 0,
  prayers_count integer not null default 0,
  quiz_completed integer not null default 0,
  rank_global_total integer null,
  rank_global_normalized integer null,
  created_at timestamptz not null default now(),
  primary key (church_id, period_key)
);

insert into public.gamification_levels (audience, level_key, name, min_xp, max_xp, description)
values
  ('user', 'visitor', 'Visitante em Jornada', 0, 99, 'Primeiros passos'),
  ('user', 'steady_reader', 'Leitor Constante', 100, 499, 'Leitura e devocional'),
  ('user', 'word_apprentice', 'Aprendiz da Palavra', 500, 1499, 'Estudo e quiz'),
  ('user', 'active_intercessor', 'Intercessor Ativo', 1500, 3999, 'Oracao e comunidade'),
  ('user', 'community_servant', 'Servo da Comunidade', 4000, 9999, 'Participacao e apoio'),
  ('user', 'digital_disciplemaker', 'Disciplador Digital', 10000, null, 'Constancia ampla'),
  ('pastor', 'leader_training', 'Lider em Formacao', 0, 99, 'Primeira sala ou plano'),
  ('pastor', 'group_mentor', 'Mentor de Grupo', 100, 499, 'Grupo ativo com membros'),
  ('pastor', 'pastoral_organizer', 'Organizador Pastoral', 500, 1499, 'Cultos e salas recorrentes'),
  ('pastor', 'journey_guardian', 'Guardiao da Jornada', 1500, 3999, 'Acompanhamento constante'),
  ('pastor', 'path_master', 'Mestre de Trilhas', 4000, 9999, 'Conteudos e planos consistentes'),
  ('pastor', 'pastoral_reference', 'Referencia Pastoral', 10000, null, 'Alta retencao e engajamento'),
  ('church', 'connected_church', 'Igreja Conectada', 0, 499, 'Perfil e membros iniciais'),
  ('church', 'active_community', 'Comunidade Ativa', 500, 1999, 'Membros ativos na semana'),
  ('church', 'house_of_prayer', 'Casa de Oracao', 2000, 4999, 'Oracoes e intercessoes'),
  ('church', 'word_school', 'Escola da Palavra', 5000, 9999, 'Leitura, estudos e salas'),
  ('church', 'mission_church', 'Igreja em Missao', 10000, 24999, 'Participacao social e desafios'),
  ('church', 'discipleship_network', 'Rede de Discipulado', 25000, null, 'Engajamento sustentado')
on conflict (audience, level_key) do update set
  name = excluded.name,
  min_xp = excluded.min_xp,
  max_xp = excluded.max_xp,
  description = excluded.description,
  is_active = true;

create or replace function public.refresh_church_gamification_snapshot(p_period_key text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.church_gamification_snapshots (
    church_id,
    period_key,
    total_xp,
    active_members,
    xp_per_active_member,
    chapters_read,
    devotionals_completed,
    prayers_count,
    quiz_completed
  )
  select
    church_id,
    p_period_key,
    coalesce(sum(xp_amount), 0)::integer as total_xp,
    count(distinct user_id)::integer as active_members,
    case when count(distinct user_id) = 0 then 0 else round(coalesce(sum(xp_amount), 0)::numeric / count(distinct user_id), 2) end as xp_per_active_member,
    count(*) filter (where action_type = 'reading_chapter')::integer as chapters_read,
    count(*) filter (where action_type = 'devotional')::integer as devotionals_completed,
    count(*) filter (where action_type = 'prayer_wall')::integer as prayers_count,
    count(*) filter (where action_type = 'quiz_completion')::integer as quiz_completed
  from public.mana_events
  where church_id is not null
    and period_key = p_period_key
    and status = 'valid'
  group by church_id
  on conflict (church_id, period_key) do update set
    total_xp = excluded.total_xp,
    active_members = excluded.active_members,
    xp_per_active_member = excluded.xp_per_active_member,
    chapters_read = excluded.chapters_read,
    devotionals_completed = excluded.devotionals_completed,
    prayers_count = excluded.prayers_count,
    quiz_completed = excluded.quiz_completed,
    created_at = now();

  with total_rank as (
    select church_id, row_number() over (order by total_xp desc) as rank_value
    from public.church_gamification_snapshots
    where period_key = p_period_key
  ),
  normalized_rank as (
    select church_id, row_number() over (order by xp_per_active_member desc) as rank_value
    from public.church_gamification_snapshots
    where period_key = p_period_key
  )
  update public.church_gamification_snapshots s
  set
    rank_global_total = total_rank.rank_value,
    rank_global_normalized = normalized_rank.rank_value
  from total_rank, normalized_rank
  where s.period_key = p_period_key
    and s.church_id = total_rank.church_id
    and s.church_id = normalized_rank.church_id;
end;
$$;

alter table public.mana_events enable row level security;
alter table public.gamification_rules enable row level security;
alter table public.gamification_levels enable row level security;
alter table public.gamification_badges enable row level security;
alter table public.church_gamification_snapshots enable row level security;

drop policy if exists "Users read own mana events" on public.mana_events;
create policy "Users read own mana events"
  on public.mana_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own valid mana events" on public.mana_events;
create policy "Users insert own valid mana events"
  on public.mana_events for insert
  with check (auth.uid() = user_id and status = 'valid');

drop policy if exists "Admins manage mana events" on public.mana_events;
create policy "Admins manage mana events"
  on public.mana_events for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.subscription_tier = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.subscription_tier = 'admin'));

drop policy if exists "Everyone reads active gamification rules" on public.gamification_rules;
create policy "Everyone reads active gamification rules"
  on public.gamification_rules for select
  using (is_enabled = true);

drop policy if exists "Everyone reads active gamification levels" on public.gamification_levels;
create policy "Everyone reads active gamification levels"
  on public.gamification_levels for select
  using (is_active = true);

drop policy if exists "Everyone reads active gamification badges" on public.gamification_badges;
create policy "Everyone reads active gamification badges"
  on public.gamification_badges for select
  using (is_active = true);

drop policy if exists "Everyone reads church gamification snapshots" on public.church_gamification_snapshots;
create policy "Everyone reads church gamification snapshots"
  on public.church_gamification_snapshots for select
  using (true);

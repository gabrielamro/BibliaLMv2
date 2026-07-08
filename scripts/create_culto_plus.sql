-- Culto+ MVP schema for Supabase.
-- Apply this script before relying on persistence beyond the browser fallback.

create table if not exists public.church_services (
  id text primary key,
  church_id uuid not null references public.churches(id) on delete cascade,
  church_name text,
  church_slug text,
  title text not null,
  theme text not null,
  preacher_name text,
  service_type text not null default 'sunday',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  key_verse_ref text,
  key_verse_text text,
  banner_url text,
  live_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived')),
  slug text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  liturgy_items jsonb not null default '[]'::jsonb,
  checkins_count integer not null default 0,
  posts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_checkins (
  id text primary key,
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_display_name text,
  user_photo_url text,
  created_at timestamptz not null default now(),
  unique(service_id, user_id)
);

create table if not exists public.service_visits (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique(service_id, session_id)
);

create table if not exists public.service_notes (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_notes
  drop constraint if exists service_notes_service_id_user_id_key;

create table if not exists public.service_reactions (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('amen', 'glory', 'hallelujah')),
  created_at timestamptz not null default now(),
  unique(service_id, user_id, reaction_type)
);

create table if not exists public.service_prayer_requests (
  id text primary key,
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  user_photo_url text,
  content text not null,
  is_private boolean not null default false,
  intercessors_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.service_prayer_intercessions (
  id uuid primary key default gen_random_uuid(),
  prayer_id text not null references public.service_prayer_requests(id) on delete cascade,
  service_id text not null references public.church_services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(prayer_id, user_id)
);

create table if not exists public.service_verse_saves (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  verse_ref text,
  verse_text text,
  created_at timestamptz not null default now(),
  unique(service_id, user_id)
);

create table if not exists public.service_ministries (
  id text primary key,
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(church_id, name)
);

create table if not exists public.service_ministry_members (
  id text primary key,
  ministry_id text not null references public.service_ministries(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_display_name text,
  user_photo_url text,
  role text,
  created_at timestamptz not null default now(),
  unique(ministry_id, user_id)
);

create table if not exists public.service_schedule_assignments (
  id text primary key,
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  ministry_id text not null references public.service_ministries(id) on delete cascade,
  ministry_name text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_display_name text,
  user_photo_url text,
  role text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'replaced')),
  reminder_sent_at timestamptz,
  replacement_user_id uuid references public.profiles(id) on delete set null,
  replacement_user_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_id, ministry_id, user_id)
);

create table if not exists public.service_live_states (
  service_id text primary key references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  current_item_id text,
  current_title text,
  current_verse_ref text,
  current_verse_text text,
  current_explanation text,
  operator_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.service_ai_contents (
  id text primary key,
  service_id text not null references public.church_services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_public_invites (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.church_services(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  invited_by_user_id uuid references public.profiles(id) on delete set null,
  invited_by_name text,
  invited_user_id uuid references public.profiles(id) on delete set null,
  invited_name text,
  token text not null unique,
  status text not null default 'created' check (status in ('created', 'opened', 'accepted', 'cancelled')),
  source text not null default 'share' check (source in ('copy', 'share', 'qr', 'manual')),
  opened_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists service_id text;
alter table public.posts add column if not exists service_title text;

create index if not exists church_services_church_id_starts_at_idx
  on public.church_services(church_id, starts_at desc);

create index if not exists service_checkins_service_id_idx
  on public.service_checkins(service_id);

create index if not exists service_visits_service_id_idx
  on public.service_visits(service_id);

create index if not exists service_notes_service_user_idx
  on public.service_notes(service_id, user_id);

create index if not exists service_reactions_service_id_idx
  on public.service_reactions(service_id);

create index if not exists service_prayer_requests_service_id_idx
  on public.service_prayer_requests(service_id, created_at desc);

create index if not exists service_prayer_intercessions_prayer_id_idx
  on public.service_prayer_intercessions(prayer_id);

create index if not exists service_verse_saves_service_id_idx
  on public.service_verse_saves(service_id);

create index if not exists service_ministries_church_id_idx
  on public.service_ministries(church_id, name);

create index if not exists service_ministry_members_ministry_id_idx
  on public.service_ministry_members(ministry_id);

create index if not exists service_schedule_assignments_service_id_idx
  on public.service_schedule_assignments(service_id, created_at desc);

create index if not exists service_live_states_church_id_idx
  on public.service_live_states(church_id, updated_at desc);

create index if not exists service_ai_contents_service_user_idx
  on public.service_ai_contents(service_id, user_id, created_at desc);

create index if not exists service_public_invites_service_status_idx
  on public.service_public_invites(service_id, status, created_at desc);

create index if not exists service_public_invites_token_idx
  on public.service_public_invites(token);

create index if not exists service_public_invites_invited_by_idx
  on public.service_public_invites(invited_by_user_id, created_at desc);

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'church_services',
    'service_live_states',
    'service_reactions',
    'service_prayer_requests',
    'posts',
    'service_checkins',
    'service_visits',
    'service_verse_saves',
    'service_schedule_assignments'
  ]
  loop
    if to_regclass(format('public.%I', realtime_table)) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table
      )
    then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
exception
  when undefined_object then
    null;
end $$;

create or replace function public.refresh_church_service_counts(p_service_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.church_services
  set
    checkins_count = (
      select count(*)::integer from public.service_checkins
      where service_id = p_service_id
    ),
    posts_count = (
      select count(*)::integer from public.posts
      where service_id = p_service_id
    ),
    updated_at = now()
  where id = p_service_id;
end;
$$;

create or replace function public.refresh_church_service_counts_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  target_service_id text;
begin
  target_service_id := coalesce(new.service_id, old.service_id);
  if target_service_id is not null then
    perform public.refresh_church_service_counts(target_service_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_service_prayer_intercessors()
returns trigger
language plpgsql
security definer
as $$
declare
  target_prayer_id text;
begin
  target_prayer_id := coalesce(new.prayer_id, old.prayer_id);
  if target_prayer_id is not null then
    update public.service_prayer_requests
    set intercessors_count = (
      select count(*)::integer from public.service_prayer_intercessions
      where prayer_id = target_prayer_id
    )
    where id = target_prayer_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists service_checkins_refresh_counts on public.service_checkins;
create trigger service_checkins_refresh_counts
  after insert or delete on public.service_checkins
  for each row execute function public.refresh_church_service_counts_trigger();

drop trigger if exists posts_refresh_service_counts on public.posts;
create trigger posts_refresh_service_counts
  after insert or delete or update of service_id on public.posts
  for each row execute function public.refresh_church_service_counts_trigger();

drop trigger if exists service_prayer_intercessions_refresh_counts on public.service_prayer_intercessions;
create trigger service_prayer_intercessions_refresh_counts
  after insert or delete on public.service_prayer_intercessions
  for each row execute function public.refresh_service_prayer_intercessors();

alter table public.church_services enable row level security;
alter table public.service_checkins enable row level security;
alter table public.service_visits enable row level security;
alter table public.service_notes enable row level security;
alter table public.service_reactions enable row level security;
alter table public.service_prayer_requests enable row level security;
alter table public.service_prayer_intercessions enable row level security;
alter table public.service_verse_saves enable row level security;
alter table public.service_ministries enable row level security;
alter table public.service_ministry_members enable row level security;
alter table public.service_schedule_assignments enable row level security;
alter table public.service_live_states enable row level security;
alter table public.service_ai_contents enable row level security;
alter table public.service_public_invites enable row level security;

grant select on public.service_public_invites to anon, authenticated;
grant insert, update on public.service_public_invites to authenticated;

drop policy if exists "Public can read published church services" on public.church_services;
create policy "Public can read published church services"
  on public.church_services for select
  using (status in ('published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived'));

drop policy if exists "Authors can read own church services" on public.church_services;
create policy "Authors can read own church services"
  on public.church_services for select
  using (auth.uid() = created_by);

drop policy if exists "Church members can create services" on public.church_services;
create policy "Church members can create services"
  on public.church_services for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = church_services.church_id
    )
  );

drop policy if exists "Authors can update their services" on public.church_services;
create policy "Authors can update their services"
  on public.church_services for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Users can read service checkins" on public.service_checkins;
create policy "Users can read service checkins"
  on public.service_checkins for select
  using (true);

drop policy if exists "Users can check in themselves" on public.service_checkins;
create policy "Users can check in themselves"
  on public.service_checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can keep own service checkin" on public.service_checkins;
create policy "Users can keep own service checkin"
  on public.service_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read service visits" on public.service_visits;
create policy "Users can read service visits"
  on public.service_visits for select
  using (true);

drop policy if exists "Public can register service visits" on public.service_visits;
create policy "Public can register service visits"
  on public.service_visits for insert
  with check (true);

drop policy if exists "Public can keep service visits deduped" on public.service_visits;
create policy "Public can keep service visits deduped"
  on public.service_visits for update
  using (true)
  with check (true);

drop policy if exists "Users can read own service notes" on public.service_notes;
create policy "Users can read own service notes"
  on public.service_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own service notes" on public.service_notes;
create policy "Users can upsert own service notes"
  on public.service_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own service notes" on public.service_notes;
create policy "Users can update own service notes"
  on public.service_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read service reactions" on public.service_reactions;
create policy "Users can read service reactions"
  on public.service_reactions for select
  using (true);

drop policy if exists "Users can react to services" on public.service_reactions;
create policy "Users can react to services"
  on public.service_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can keep own service reactions" on public.service_reactions;
create policy "Users can keep own service reactions"
  on public.service_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read public service prayer requests" on public.service_prayer_requests;
create policy "Users can read public service prayer requests"
  on public.service_prayer_requests for select
  using (is_private = false or auth.uid() = user_id);

drop policy if exists "Users can create service prayer requests" on public.service_prayer_requests;
create policy "Users can create service prayer requests"
  on public.service_prayer_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own service prayer requests" on public.service_prayer_requests;
create policy "Users can update own service prayer requests"
  on public.service_prayer_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read service prayer intercessions" on public.service_prayer_intercessions;
create policy "Users can read service prayer intercessions"
  on public.service_prayer_intercessions for select
  using (true);

drop policy if exists "Users can intercede service prayers" on public.service_prayer_intercessions;
create policy "Users can intercede service prayers"
  on public.service_prayer_intercessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read service verse saves" on public.service_verse_saves;
create policy "Users can read service verse saves"
  on public.service_verse_saves for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save service key verse" on public.service_verse_saves;
create policy "Users can save service key verse"
  on public.service_verse_saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own service key verse save" on public.service_verse_saves;
create policy "Users can update own service key verse save"
  on public.service_verse_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read church service ministries" on public.service_ministries;
create policy "Users can read church service ministries"
  on public.service_ministries for select
  using (true);

drop policy if exists "Church members can create service ministries" on public.service_ministries;
create policy "Church members can create service ministries"
  on public.service_ministries for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_ministries.church_id
    )
  );

drop policy if exists "Church members can read ministry members" on public.service_ministry_members;
create policy "Church members can read ministry members"
  on public.service_ministry_members for select
  using (true);

drop policy if exists "Church members can add ministry members" on public.service_ministry_members;
create policy "Church members can add ministry members"
  on public.service_ministry_members for insert
  with check (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_ministry_members.church_id
    )
  );

drop policy if exists "Church members can update ministry members" on public.service_ministry_members;
create policy "Church members can update ministry members"
  on public.service_ministry_members for update
  using (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_ministry_members.church_id
    )
  )
  with check (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_ministry_members.church_id
    )
  );

drop policy if exists "Church members can read service schedules" on public.service_schedule_assignments;
create policy "Church members can read service schedules"
  on public.service_schedule_assignments for select
  using (true);

drop policy if exists "Church members can create service schedules" on public.service_schedule_assignments;
create policy "Church members can create service schedules"
  on public.service_schedule_assignments for insert
  with check (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_schedule_assignments.church_id
    )
  );

drop policy if exists "Church members can update service schedules" on public.service_schedule_assignments;
create policy "Church members can update service schedules"
  on public.service_schedule_assignments for update
  using (
    user_id = auth.uid()
    or replacement_user_id = auth.uid()
    or exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_schedule_assignments.church_id
    )
  )
  with check (
    user_id = auth.uid()
    or replacement_user_id = auth.uid()
    or exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_schedule_assignments.church_id
    )
  );

drop policy if exists "Public can read service live states" on public.service_live_states;
create policy "Public can read service live states"
  on public.service_live_states for select
  using (true);

drop policy if exists "Church members can upsert service live states" on public.service_live_states;
create policy "Church members can upsert service live states"
  on public.service_live_states for insert
  with check (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_live_states.church_id
    )
  );

drop policy if exists "Church members can update service live states" on public.service_live_states;
create policy "Church members can update service live states"
  on public.service_live_states for update
  using (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_live_states.church_id
    )
  )
  with check (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.church_id = service_live_states.church_id
    )
  );

drop policy if exists "Users can read own service ai contents" on public.service_ai_contents;
create policy "Users can read own service ai contents"
  on public.service_ai_contents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own service ai contents" on public.service_ai_contents;
create policy "Users can create own service ai contents"
  on public.service_ai_contents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Public can read service invites by token" on public.service_public_invites;
create policy "Public can read service invites by token"
  on public.service_public_invites
  for select
  to anon, authenticated
  using (status in ('created', 'opened', 'accepted'));

drop policy if exists "Authenticated users can create service invites" on public.service_public_invites;
create policy "Authenticated users can create service invites"
  on public.service_public_invites
  for insert
  to authenticated
  with check ((select auth.uid()) = invited_by_user_id);

drop policy if exists "Invite actors can update service invites" on public.service_public_invites;
create policy "Invite actors can update service invites"
  on public.service_public_invites
  for update
  to authenticated
  using (
    (select auth.uid()) = invited_by_user_id
    or invited_user_id is null
    or (select auth.uid()) = invited_user_id
  )
  with check (
    (select auth.uid()) = invited_by_user_id
    or invited_user_id is null
    or (select auth.uid()) = invited_user_id
  );

-- Hardening for Culto+ journey states and public OnePage access.
-- Safe to run more than once after scripts/create_culto_plus.sql.

alter table public.church_services
  add column if not exists live_url text;

do $$
begin
  update public.church_services
  set status = 'published'
  where status is null
     or status not in ('draft', 'published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived');

  if not exists (
    select 1
    from pg_constraint
    where conname = 'church_services_status_check'
      and conrelid = 'public.church_services'::regclass
  ) then
    alter table public.church_services
      add constraint church_services_status_check
      check (status in ('draft', 'published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived'));
  end if;
end $$;

create index if not exists church_services_public_status_starts_at_idx
  on public.church_services(status, starts_at)
  where status in ('published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived');

create index if not exists church_services_slug_status_idx
  on public.church_services(slug, status);

grant select on public.church_services to anon, authenticated;
grant insert, update on public.church_services to authenticated;

grant select on public.service_checkins to anon, authenticated;
grant insert, update on public.service_checkins to authenticated;

grant select, insert, update on public.service_visits to anon, authenticated;

grant select, insert, update, delete on public.service_notes to authenticated;

grant select on public.service_reactions to anon, authenticated;
grant insert, update on public.service_reactions to authenticated;

grant select on public.service_prayer_requests to anon, authenticated;
grant insert, update on public.service_prayer_requests to authenticated;

grant select on public.service_prayer_intercessions to anon, authenticated;
grant insert on public.service_prayer_intercessions to authenticated;

grant select, insert, update on public.service_verse_saves to authenticated;

grant select on public.service_ministries to anon, authenticated;
grant insert, update on public.service_ministries to authenticated;

grant select on public.service_ministry_members to anon, authenticated;
grant insert, update on public.service_ministry_members to authenticated;

grant select on public.service_schedule_assignments to anon, authenticated;
grant insert, update on public.service_schedule_assignments to authenticated;

grant select on public.service_live_states to anon, authenticated;
grant insert, update on public.service_live_states to authenticated;

grant select, insert on public.service_ai_contents to authenticated;

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

drop policy if exists "Public can read published church services" on public.church_services;
create policy "Public can read published church services"
  on public.church_services
  for select
  to anon, authenticated
  using (status in ('published', 'checkin_open', 'live', 'in_progress', 'finished', 'archived'));

drop policy if exists "Authors can read own church services" on public.church_services;
create policy "Authors can read own church services"
  on public.church_services
  for select
  to authenticated
  using ((select auth.uid()) = created_by);

drop policy if exists "Church members can create services" on public.church_services;
create policy "Church members can create services"
  on public.church_services
  for insert
  to authenticated
  with check (
    (select auth.uid()) = created_by
    and exists (
      select 1
      from public.memberships
      where memberships.user_id = (select auth.uid())
        and memberships.church_id = church_services.church_id
    )
  );

drop policy if exists "Authors can update their services" on public.church_services;
create policy "Authors can update their services"
  on public.church_services
  for update
  to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

drop policy if exists "Users can check in themselves" on public.service_checkins;
create policy "Users can check in themselves"
  on public.service_checkins
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.church_services
      where church_services.id = service_checkins.service_id
        and church_services.status in ('published', 'checkin_open', 'live', 'in_progress')
    )
  );

drop policy if exists "Users can keep own service checkin" on public.service_checkins;
create policy "Users can keep own service checkin"
  on public.service_checkins
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own service notes" on public.service_notes;
create policy "Users can read own service notes"
  on public.service_notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can upsert own service notes" on public.service_notes;
create policy "Users can upsert own service notes"
  on public.service_notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own service notes" on public.service_notes;
create policy "Users can update own service notes"
  on public.service_notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own service notes" on public.service_notes;
create policy "Users can delete own service notes"
  on public.service_notes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can react to services" on public.service_reactions;
create policy "Users can react to services"
  on public.service_reactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can keep own service reactions" on public.service_reactions;
create policy "Users can keep own service reactions"
  on public.service_reactions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can create service prayer requests" on public.service_prayer_requests;
create policy "Users can create service prayer requests"
  on public.service_prayer_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own service prayer requests" on public.service_prayer_requests;
create policy "Users can update own service prayer requests"
  on public.service_prayer_requests
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can intercede service prayers" on public.service_prayer_intercessions;
create policy "Users can intercede service prayers"
  on public.service_prayer_intercessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can save service key verse" on public.service_verse_saves;
create policy "Users can save service key verse"
  on public.service_verse_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own service key verse save" on public.service_verse_saves;
create policy "Users can update own service key verse save"
  on public.service_verse_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

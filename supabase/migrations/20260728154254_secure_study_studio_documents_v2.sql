alter table public.public_studies
  add column if not exists document jsonb not null default '{"version":2,"title":"","blocks":[],"meta":{}}'::jsonb,
  add column if not exists schema_version integer not null default 2,
  add column if not exists revision bigint not null default 0;

alter table public.custom_plans
  add column if not exists document jsonb,
  add column if not exists schema_version integer not null default 2,
  add column if not exists revision bigint not null default 0;

create index if not exists public_studies_user_updated_idx
  on public.public_studies (user_id, updated_at desc);
create index if not exists public_studies_status_published_idx
  on public.public_studies (status, published_at desc);
create unique index if not exists public_studies_published_slug_uidx
  on public.public_studies (slug) where status = 'published' and slug is not null;
create index if not exists custom_plans_author_updated_idx
  on public.custom_plans (author_id, updated_at desc);

alter table public.public_studies enable row level security;
alter table public.custom_plans enable row level security;

drop policy if exists "Estudos públicos são visíveis" on public.public_studies;
drop policy if exists "Qualquer um vê estudos públicos" on public.public_studies;
drop policy if exists "Usuários deletam próprios estudos públicos" on public.public_studies;
drop policy if exists "Usuários editam próprios estudos públicos" on public.public_studies;
drop policy if exists "Usuários postam estudos públicos" on public.public_studies;

create policy "Leitura de estudos publicados ou próprios"
on public.public_studies for select
using (status = 'published' or auth.uid() = user_id);

create policy "Autores criam estudos"
on public.public_studies for insert to authenticated
with check (auth.uid() = user_id);

create policy "Autores atualizam estudos"
on public.public_studies for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Autores removem estudos"
on public.public_studies for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Autores gerenciam planos" on public.custom_plans;
drop policy if exists "Planos públicos são visíveis" on public.custom_plans;

create policy "Leitura de planos públicos ou próprios"
on public.custom_plans for select
using (is_public = true or auth.uid() = author_id);

create policy "Autores criam planos"
on public.custom_plans for insert to authenticated
with check (auth.uid() = author_id);

create policy "Autores atualizam planos"
on public.custom_plans for update to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Autores removem planos"
on public.custom_plans for delete to authenticated
using (auth.uid() = author_id);

revoke all on table public.public_studies from anon;
grant select on table public.public_studies to anon;
grant select, insert, update, delete on table public.public_studies to authenticated;

revoke all on table public.custom_plans from anon;
grant select on table public.custom_plans to anon;
grant select, insert, update, delete on table public.custom_plans to authenticated;

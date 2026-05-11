alter table if exists public.posts
  add column if not exists views_count integer not null default 0;

alter table if exists public.custom_plans
  add column if not exists views_count integer not null default 0;

alter table if exists public.public_studies
  add column if not exists views_count integer not null default 0;

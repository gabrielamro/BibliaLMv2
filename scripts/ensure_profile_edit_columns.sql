-- Ensure profile fields used by cadastro/edicao de perfil exist in Supabase.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists phone_number text,
  add column if not exists cpf text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists slogan text,
  add column if not exists is_profile_public boolean default true,
  add column if not exists theme text default 'light',
  add column if not exists photo_url text,
  add column if not exists church_data jsonb default '{}'::jsonb;

update public.profiles
set
  is_profile_public = coalesce(is_profile_public, true),
  theme = coalesce(theme, 'light'),
  church_data = coalesce(church_data, '{}'::jsonb);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_check
      check (theme in ('light', 'dark'));
  end if;
end $$;

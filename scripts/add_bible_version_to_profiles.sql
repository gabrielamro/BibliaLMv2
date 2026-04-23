alter table public.profiles
add column if not exists bible_version text not null default 'ara';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_bible_version_check'
  ) then
    alter table public.profiles
    add constraint profiles_bible_version_check
    check (bible_version in ('ara', 'arc', 'nvi', 'acf', 'almeida1917'))
    not valid;
  end if;
end $$;

alter table public.profiles
validate constraint profiles_bible_version_check;

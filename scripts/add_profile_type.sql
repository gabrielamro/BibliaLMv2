alter table public.profiles
  add column if not exists profile_type text not null default 'user';

update public.profiles
set profile_type = case
  when subscription_tier = 'pastor' then 'pastor'
  when profile_type in ('user', 'pastor', 'manager') then profile_type
  else 'user'
end;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_profile_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_profile_type_check
      check (profile_type in ('user', 'pastor', 'manager'));
  end if;
end $$;

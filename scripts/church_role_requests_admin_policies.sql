-- Politicas para o painel admin aprovar solicitacoes de gestao de igreja.
-- Execute no SQL Editor do Supabase se a listagem/aprovacao falhar por RLS.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.subscription_tier = 'admin'
        or profiles.username = 'gabrielamaro'
        or profiles.email = 'gabrielamaro@live.com'
      )
  );
$$;

drop policy if exists "Platform admins can read church role requests" on public.church_role_requests;
create policy "Platform admins can read church role requests"
  on public.church_role_requests
  for select
  using (public.is_platform_admin());

drop policy if exists "Platform admins can review church role requests" on public.church_role_requests;
create policy "Platform admins can review church role requests"
  on public.church_role_requests
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Platform admins can update churches for role approval" on public.churches;
create policy "Platform admins can update churches for role approval"
  on public.churches
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Platform admins can manage memberships for role approval" on public.memberships;
create policy "Platform admins can manage memberships for role approval"
  on public.memberships
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
z
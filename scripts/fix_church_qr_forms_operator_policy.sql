-- Corrige criacao/gestao de QR operacional por usuarios autorizados da Gestao da Igreja.
-- Sintoma: criar QR de voluntariado no popup do time falha com RLS 42501.
-- A policy anterior usava can_manage_church_operations(), restrita a church_manager.
-- Para convites operacionais de time, pastor/lider autorizado tambem precisa criar QR.

drop policy if exists "Church operators manage QR forms" on public.church_qr_forms;

create policy "Church operators manage QR forms"
  on public.church_qr_forms for all
  using (
    public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'])
  )
  with check (
    public.has_church_role(church_id, array['church_manager', 'pastor', 'leader'])
  );

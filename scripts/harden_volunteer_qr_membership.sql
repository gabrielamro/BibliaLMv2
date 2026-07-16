-- Restringe candidaturas de voluntariado a usuários autenticados que sejam
-- membros da igreja responsável pelo convite. Outros tipos de QR permanecem públicos.
drop policy if exists "Public can create active form submissions" on public.church_form_submissions;
create policy "Public can create active form submissions"
  on public.church_form_submissions for insert
  with check (
    exists (
      select 1
      from public.church_qr_forms f
      where f.id = church_form_submissions.form_id
        and f.church_id = church_form_submissions.church_id
        and f.form_type = church_form_submissions.form_type
        and f.status = 'active'
        and (f.expires_at is null or f.expires_at > now())
        and (
          f.form_type <> 'volunteer'
          or (
            auth.uid() is not null
            and church_form_submissions.submitter_user_id = auth.uid()
            and exists (
              select 1
              from public.memberships m
              where m.user_id = auth.uid()
                and m.church_id = church_form_submissions.church_id
            )
          )
        )
    )
  );

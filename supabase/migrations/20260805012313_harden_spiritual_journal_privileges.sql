-- Remove privilégios automáticos que excedem as operações usadas pelo cliente.
REVOKE ALL PRIVILEGES
    ON public.spiritual_day_entries, public.user_content_favorites
    FROM anon, authenticated;

-- Usuários autenticados acessam somente as operações protegidas pelas políticas RLS.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.spiritual_day_entries, public.user_content_favorites
    TO authenticated;

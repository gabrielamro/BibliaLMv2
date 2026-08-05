-- Migration: Spiritual Journal & Unified Favorites
-- Date: 2026-08-04
-- Author: Culto+ Architecture Team

-- 1. Tabela: spiritual_day_entries (linha do tempo privada do dia)
CREATE TABLE IF NOT EXISTS public.spiritual_day_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    heart_state TEXT CHECK (heart_state IN ('em_paz', 'grato', 'esperancoso', 'cansado', 'ansioso', 'triste', 'direcao')),
    heart_state_note TEXT,
    private_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT spiritual_day_entries_user_date_unique UNIQUE (user_id, entry_date)
);

ALTER TABLE public.spiritual_day_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own spiritual day entries"
    ON public.spiritual_day_entries;

CREATE POLICY "Users can manage their own spiritual day entries"
    ON public.spiritual_day_entries
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_spiritual_day_entries_user_date
    ON public.spiritual_day_entries(user_id, entry_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.spiritual_day_entries
    TO authenticated;

-- 2. Tabela: user_content_favorites (biblioteca de favoritos unificada)
CREATE TABLE IF NOT EXISTS public.user_content_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('verse', 'devotional', 'study', 'track', 'prayer', 'service_note', 'post')),
    content_id TEXT NOT NULL,
    title TEXT NOT NULL,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_content_favorites_user_type_id_unique UNIQUE (user_id, content_type, content_id)
);

ALTER TABLE public.user_content_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own content favorites"
    ON public.user_content_favorites;

CREATE POLICY "Users can manage their own content favorites"
    ON public.user_content_favorites
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_content_favorites_user_type
    ON public.user_content_favorites(user_id, content_type);

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.user_content_favorites
    TO authenticated;

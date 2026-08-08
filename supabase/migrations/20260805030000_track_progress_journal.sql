-- Persistência privada de progresso e anotações das Trilhas de Estudo.

CREATE TABLE IF NOT EXISTS public.user_track_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL CHECK (char_length(track_id) BETWEEN 1 AND 120),
    current_step_index INTEGER NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
    completed_step_numbers INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    CONSTRAINT user_track_progress_user_track_unique UNIQUE (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_user_track_progress_user_updated
    ON public.user_track_progress(user_id, updated_at DESC);

ALTER TABLE public.user_track_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own track progress"
    ON public.user_track_progress;

CREATE POLICY "Users can manage their own track progress"
    ON public.user_track_progress
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.track_step_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL CHECK (char_length(track_id) BETWEEN 1 AND 120),
    track_title TEXT NOT NULL CHECK (char_length(track_title) BETWEEN 1 AND 180),
    step_number INTEGER NOT NULL CHECK (step_number > 0),
    step_title TEXT NOT NULL CHECK (char_length(step_title) BETWEEN 1 AND 180),
    note TEXT NOT NULL CHECK (char_length(note) BETWEEN 1 AND 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT track_step_journal_entries_user_track_step_unique UNIQUE (user_id, track_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_track_step_journal_entries_user_created
    ON public.track_step_journal_entries(user_id, created_at DESC);

ALTER TABLE public.track_step_journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own track journal entries"
    ON public.track_step_journal_entries;

CREATE POLICY "Users can manage their own track journal entries"
    ON public.track_step_journal_entries
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL PRIVILEGES
    ON public.user_track_progress, public.track_step_journal_entries
    FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.user_track_progress, public.track_step_journal_entries
    TO authenticated;

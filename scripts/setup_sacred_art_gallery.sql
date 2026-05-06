-- Criar tabela de galeria de arte sacra
CREATE TABLE IF NOT EXISTS public.sacred_art_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    prompt TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    style TEXT,
    verse_text TEXT,
    verse_reference TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.sacred_art_gallery ENABLE ROW LEVEL SECURITY;

-- Politicas de seguranca idempotentes
DROP POLICY IF EXISTS "Leitura livre galeria" ON public.sacred_art_gallery;
CREATE POLICY "Leitura livre galeria"
ON public.sacred_art_gallery FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Usuarios adicionam galeria" ON public.sacred_art_gallery;
DROP POLICY IF EXISTS "Usuários adicionam galeria" ON public.sacred_art_gallery;
CREATE POLICY "Usuarios adicionam galeria"
ON public.sacred_art_gallery FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios editam galeria" ON public.sacred_art_gallery;
DROP POLICY IF EXISTS "Usuários editam galeria" ON public.sacred_art_gallery;
CREATE POLICY "Usuarios editam galeria"
ON public.sacred_art_gallery FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios deletam galeria" ON public.sacred_art_gallery;
DROP POLICY IF EXISTS "Usuários deletam galeria" ON public.sacred_art_gallery;
CREATE POLICY "Usuarios deletam galeria"
ON public.sacred_art_gallery FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

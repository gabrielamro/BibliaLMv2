-- ==========================================
-- FIX ESTUDOS SCHEMA (BíbliaLM)
-- Executar este script no SQL Editor do Supabase
-- ==========================================

DO $$
BEGIN
    -- 1. ADICIONAR COLUNAS NA TABELA public.public_studies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'blocks') THEN
        ALTER TABLE public.public_studies ADD COLUMN blocks text DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'meta') THEN
        ALTER TABLE public.public_studies ADD COLUMN meta text DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'status') THEN
        ALTER TABLE public.public_studies ADD COLUMN status text DEFAULT 'draft';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'slug') THEN
        ALTER TABLE public.public_studies ADD COLUMN slug text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'type') THEN
        ALTER TABLE public.public_studies ADD COLUMN type text DEFAULT 'article';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'updated_at') THEN
        ALTER TABLE public.public_studies ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'cover_image') THEN
        ALTER TABLE public.public_studies ADD COLUMN cover_image text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_studies' AND column_name = 'created_at') THEN
        ALTER TABLE public.public_studies ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    -- 2. ADICIONAR COLUNAS NA TABELA public.studies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studies' AND column_name = 'blocks') THEN
        ALTER TABLE public.studies ADD COLUMN blocks text DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studies' AND column_name = 'meta') THEN
        ALTER TABLE public.studies ADD COLUMN meta text DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studies' AND column_name = 'cover_image') THEN
        ALTER TABLE public.studies ADD COLUMN cover_image text;
    END IF;

    -- 3. HABILITAR GEN_RANDOM_UUID SE NECESSÁRIO NO DEFAULT DO ID
    ALTER TABLE public.public_studies ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE public.studies ALTER COLUMN id SET DEFAULT gen_random_uuid();

    -- 4. ADICIONAR POLÍTICAS RLS FALTANTES (Estudos Públicos)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_studies' AND policyname = 'Usuários editam próprios estudos públicos') THEN
        CREATE POLICY "Usuários editam próprios estudos públicos" ON public.public_studies FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_studies' AND policyname = 'Usuários deletam próprios estudos públicos') THEN
        CREATE POLICY "Usuários deletam próprios estudos públicos" ON public.public_studies FOR DELETE USING (auth.uid() = user_id);
    END IF;

END $$;

-- Garantir que todos os campos JSON/TEXT tenham valores default válidos
UPDATE public.public_studies SET blocks = '[]' WHERE blocks IS NULL;
UPDATE public.public_studies SET meta = '{}' WHERE meta IS NULL;
UPDATE public.studies SET blocks = '[]' WHERE blocks IS NULL;
UPDATE public.studies SET meta = '{}' WHERE meta IS NULL;

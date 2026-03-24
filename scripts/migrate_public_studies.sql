-- Migration: Adicionar colunas faltantes em public_studies para suportar o Landing Page Creator
-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Adicionar colunas faltantes (idempotente com IF NOT EXISTS não existe em Postgres, mas add column ignora se já existir em alguns casos)
-- Usaremos DO blocks para segurança

DO $$
BEGIN

  -- Coluna: type (tipo de conteúdo: article, devotional, series)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN type text DEFAULT 'article';
  END IF;

  -- Coluna: slug (identificador único amigável)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN slug text;
  END IF;

  -- Coluna: status (draft, preview, published)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN status text DEFAULT 'draft';
  END IF;

  -- Coluna: blocks (blocos de conteúdo em JSON)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'blocks'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN blocks text DEFAULT '[]';
  END IF;

  -- Coluna: meta (metadados em JSON - title, description, tags, coverImage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'meta'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN meta text DEFAULT '{}';
  END IF;

  -- Coluna: created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Coluna: updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

END $$;

-- 2. Garantir que a primary key tem DEFAULT gen_random_uuid() para inserções sem ID explícito
-- (se o id não tiver default, inserções sem id vão falhar)
-- Verificar e adicionar default se necessário
ALTER TABLE public.public_studies ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Adicionar políticas RLS faltantes para UPDATE e DELETE pelo dono
DO $$
BEGIN
  -- Policy para UPDATE pelo dono
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'public_studies' AND policyname = 'Usuários editam próprios estudos públicos'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários editam próprios estudos públicos" ON public.public_studies FOR UPDATE USING (auth.uid() = user_id)';
  END IF;

  -- Policy para DELETE pelo dono
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'public_studies' AND policyname = 'Usuários deletam próprios estudos públicos'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários deletam próprios estudos públicos" ON public.public_studies FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'public_studies'
ORDER BY ordinal_position;

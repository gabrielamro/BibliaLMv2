-- Modalidade de participação do culto (presencial/online/híbrido).
-- `service_type` descreve a categoria litúrgica (domingo, jovens, vigília, ...) e não a modalidade,
-- por isso a agenda pública precisa de uma coluna própria e determinística.
-- Registros existentes assumem `presencial`, exceto os que já possuem link de transmissão.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'church_services'
    ) THEN
        RAISE NOTICE 'public.church_services ausente; aplique scripts/create_culto_plus.sql antes desta migration.';
        RETURN;
    END IF;

    ALTER TABLE public.church_services
        ADD COLUMN IF NOT EXISTS modality TEXT NOT NULL DEFAULT 'presencial';

    -- Backfill não destrutivo: apenas preenche a coluna nova, sem tocar nos demais campos.
    UPDATE public.church_services
    SET modality = 'online'
    WHERE modality = 'presencial'
      AND live_url IS NOT NULL
      AND btrim(live_url) <> '';

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.church_services'::regclass
          AND conname = 'church_services_modality_check'
    ) THEN
        ALTER TABLE public.church_services
            ADD CONSTRAINT church_services_modality_check
            CHECK (modality IN ('presencial', 'online', 'hibrido'));
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS church_services_modality_starts_at_idx ON public.church_services(modality, starts_at DESC)';
END
$$;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function setupTrackingTable() {
  console.log("⏳ Criando tabela de logs de acesso...");
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: `
    CREATE TABLE IF NOT EXISTS public.public_study_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      study_id UUID REFERENCES public.public_studies(id) ON DELETE CASCADE,
      user_id UUID,
      user_name TEXT,
      user_photo TEXT,
      accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Habilitar RLS
    ALTER TABLE public.public_study_logs ENABLE ROW LEVEL SECURITY;
    
    -- Política para inserção anônima/autenticada (Rastreamento)
    DO $$ BEGIN
      CREATE POLICY "Permitir inserção de logs para todos" ON public.public_study_logs FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- Política para leitura apenas do autor do estudo
    DO $$ BEGIN
      CREATE POLICY "Apenas autores podem ver os logs dos seus estudos" ON public.public_study_logs FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.public_studies 
          WHERE public.public_studies.id = public.public_study_logs.study_id 
          AND public.public_studies.user_id = auth.uid()
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `});

  if (error) {
    console.error("❌ Erro ao criar tabela via RPC (tentando alternativa):", error);
    // Se o RPC não existir, o usuário precisa rodar manualmente.
    console.log("Instrução: Rode o SQL fornecido no Dashboard do Supabase.");
  } else {
    console.log("✅ Tabela e políticas configuradas com sucesso.");
  }
}

setupTrackingTable();

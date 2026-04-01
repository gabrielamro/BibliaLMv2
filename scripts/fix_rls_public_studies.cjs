const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: 'db.sewwhyxrvkcptchakocc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '[$3curityAmr550903]',
  ssl: { rejectUnauthorized: false }
});

const migrationSQL = `
-- Adicionar políticas RLS faltantes para public_studies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'public_studies' 
    AND policyname = 'Usuários editam próprios estudos públicos'
  ) THEN
    CREATE POLICY "Usuários editam próprios estudos públicos" ON public.public_studies FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'public_studies' 
    AND policyname = 'Usuários deletam próprios estudos públicos'
  ) THEN
    CREATE POLICY "Usuários deletam próprios estudos públicos" ON public.public_studies FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
`;

async function run() {
  console.log('Aplicando políticas RLS para public_studies...');
  try {
    await client.connect();
    console.log('✅ Conectado!');
    await client.query(migrationSQL);
    console.log('✅ Políticas aplicadas com sucesso!');
    await client.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}
run();

const { Client } = require('pg');
require('dotenv').config();

// Try connecting with session mode (port 5432) instead of transaction mode (6543)
const client = new Client({
  host: 'db.sewwhyxrvkcptchakocc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '[$3curityAmr550903]',
  ssl: { rejectUnauthorized: false }
});

const migrationSQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN type text DEFAULT 'article';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN slug text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN status text DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'blocks'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN blocks text DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'meta'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN meta text DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

ALTER TABLE public.public_studies ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'public_studies' AND policyname = 'Usuários editam próprios estudos públicos'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários editam próprios estudos públicos" ON public.public_studies FOR UPDATE USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'public_studies' AND policyname = 'Usuários deletam próprios estudos públicos'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários deletam próprios estudos públicos" ON public.public_studies FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;
`;

async function run() {
  console.log('Conectando ao PostgreSQL direto...');
  try {
    await client.connect();
    console.log('✅ Conectado!');
    
    const r = await client.query(migrationSQL);
    console.log('✅ Migração executada com sucesso!');

    // Verify
    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name='public_studies'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas em public_studies:');
    cols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
    
    await client.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    await client.end().catch(() => {});
  }
  process.exit(0);
}
run();

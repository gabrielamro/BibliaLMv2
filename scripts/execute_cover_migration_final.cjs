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
-- Migration: Adicionar coluna de capa (cover_image) para estudos
-- Tabelas: public_studies e studies

DO $$
BEGIN
  -- 1. Adicionar cover_image na public_studies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_studies' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE public.public_studies ADD COLUMN cover_image text;
  END IF;

  -- 2. Adicionar cover_image na studies (privados)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studies' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE public.studies ADD COLUMN cover_image text;
  END IF;

END $$;
`;

async function run() {
  console.log('Conectando ao Supabase DB para migração de capa (tentativa final)...');
  try {
    await client.connect();
    console.log('✅ Conectado!');
    
    await client.query(migrationSQL);
    console.log('✅ Migração cover_image executada com sucesso!');

    // Verify
    const publicCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name='public_studies' AND column_name = 'cover_image'
    `);
    
    console.log('\nVerificação:');
    console.log('  public_studies.cover_image:', publicCols.rows.length > 0 ? 'EXISTENTE' : 'NÃO ENCONTRADA');
    
    await client.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}
run();

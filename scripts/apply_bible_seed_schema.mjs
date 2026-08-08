import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL e obrigatoria para preparar a carga biblica.');

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260806010000_deduplicate_bible_verses.sql'),
  'utf8',
);
const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  const { rows } = await client.query('select count(*)::int as count from public.bible_verses');
  await client.query('commit');
  console.log(`Schema biblico preparado. Versiculos distintos atuais: ${rows[0].count}.`);
} catch (error) {
  await client.query('rollback').catch(() => {});
  throw error;
} finally {
  await client.end();
}

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured.');

const migrationUrl = new URL('../supabase/migrations/20260722145400_daily_devotional_rotation.sql', import.meta.url);
const sql = await readFile(fileURLToPath(migrationUrl), 'utf8');
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Daily devotional migration applied successfully.');
} catch (error) {
  await client.query('rollback').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

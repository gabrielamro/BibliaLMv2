import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getConnectionString, withDbClient } from './lib/churchManagementDb.mjs';

const sqlPath = resolve('scripts/create_church_management.sql');
const connection = getConnectionString();

if (!connection) {
  console.error('Missing Postgres connection string. Set SUPABASE_DB_URL, SUPABASE_DATABASE_URL, DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

const sql = await readFile(sqlPath, 'utf8');

try {
  await withDbClient(async (client) => {
    console.log(`Applying church management SQL using ${connection.name}...`);
    await client.query(sql);
    console.log('Church management SQL applied.');
  });
} catch (error) {
  console.error(`Could not apply church management SQL using ${connection.name}: ${error.message}`);
  process.exit(1);
}

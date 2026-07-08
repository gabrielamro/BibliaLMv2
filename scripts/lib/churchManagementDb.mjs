import 'dotenv/config';
import pg from 'pg';

export const connectionEnvNames = [
  'SUPABASE_DB_URL',
  'SUPABASE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
];

export function getConnectionString() {
  for (const name of connectionEnvNames) {
    if (process.env[name]) return { name, value: process.env[name] };
  }
  return null;
}

export function createDbClient() {
  const connection = getConnectionString();
  if (!connection) {
    throw new Error(`Missing Postgres connection string. Set one of: ${connectionEnvNames.join(', ')}`);
  }

  return new pg.Client({
    connectionString: connection.value,
    ssl: connection.value.includes('localhost') || connection.value.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
}

export async function withDbClient(callback) {
  const client = createDbClient();
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

export function printCheck(label, passed, detail = '') {
  const marker = passed ? 'ok' : 'fail';
  console.log(`${marker} ${label}${detail ? ` - ${detail}` : ''}`);
}

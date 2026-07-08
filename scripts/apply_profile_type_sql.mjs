import fs from 'node:fs/promises';
import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const connection = getConnectionString();
if (!connection) {
  console.error('Missing Postgres connection string.');
  process.exit(1);
}

await withDbClient(async (client) => {
  const sql = await fs.readFile(new URL('./add_profile_type.sql', import.meta.url), 'utf8');
  await client.query(sql);

  const column = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'profile_type'
  `);
  printCheck('profiles.profile_type exists', column.rowCount === 1);

  const constraint = await client.query(`
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_profile_type_check'
  `);
  printCheck('profiles_profile_type_check exists', constraint.rowCount === 1);

  const invalid = await client.query(`
    select count(*)::int as total
    from public.profiles
    where profile_type not in ('user', 'pastor', 'manager')
  `);
  printCheck('profile_type values are valid', invalid.rows[0]?.total === 0, `invalid=${invalid.rows[0]?.total ?? 'unknown'}`);
});

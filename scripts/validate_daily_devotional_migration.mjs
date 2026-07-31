import 'dotenv/config';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured.');

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows: tables } = await client.query(`
    select c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any($1::text[])
    order by c.relname
  `, [[
    'daily_devotional_content',
    'daily_devotional_schedule',
    'user_daily_devotional_state',
    'user_daily_devotional_views',
  ]]);
  const { rows: policies } = await client.query(`
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any($1::text[])
  `, [tables.map((item) => item.table_name)]);
  const { rows: privileges } = await client.query(`
    select
      has_table_privilege('anon', 'public.daily_devotional_content', 'insert,update,delete') as anon_can_write,
      has_table_privilege('authenticated', 'public.daily_devotional_content', 'insert,update,delete') as authenticated_can_write,
      has_table_privilege('anon', 'public.daily_devotional_schedule', 'insert,update,delete') as anon_can_schedule,
      has_table_privilege('authenticated', 'public.user_daily_devotional_state', 'insert,update,delete') as authenticated_can_change_state
  `);

  if (tables.length !== 4 || tables.some((item) => !item.rls_enabled)) {
    throw new Error('Daily devotional tables or RLS configuration are incomplete.');
  }
  if (policies.length !== 4) throw new Error('Daily devotional RLS policies are incomplete.');
  if (Object.values(privileges[0] ?? {}).some(Boolean)) {
    throw new Error('A browser role still has write permission on the daily devotional schema.');
  }
  console.log('Daily devotional schema validated: 4 tables, RLS enabled, 4 read policies, browser writes denied.');
} finally {
  await client.end();
}

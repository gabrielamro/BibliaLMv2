import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const requiredTables = [
  'church_member_roles',
  'church_service_teams',
  'church_assignments',
  'church_qr_forms',
  'church_form_submissions',
  'church_management_notifications',
  'church_notification_events',
  'church_volunteer_badges',
  'church_management_settings',
  'church_analytics_snapshots',
];

const requiredFunctions = [
  'has_church_role',
  'can_manage_church_operations',
  'can_manage_church_care',
  'increment_church_qr_counter',
  'notify_church_form_submission',
];

const requiredPolicies = [
  ['church_member_roles', 'Church roles readable by church operators and self'],
  ['church_service_teams', 'Church teams readable by members'],
  ['church_assignments', 'Assignments readable by operators leaders and assignee'],
  ['church_qr_forms', 'Active QR forms public by token'],
  ['church_form_submissions', 'Public can create active form submissions'],
  ['church_management_notifications', 'Notifications readable by recipient or church operators'],
  ['church_notification_events', 'Notification events readable by recipient or church operators'],
  ['church_volunteer_badges', 'Badges readable by user and church roles'],
  ['church_management_settings', 'Church settings readable by operators'],
  ['church_analytics_snapshots', 'Church analytics readable by operators'],
];

const requiredColumns = [
  ['church_assignments', 'source_type'],
  ['church_assignments', 'source_id'],
  ['church_form_submissions', 'source_type'],
  ['church_form_submissions', 'source_id'],
];

const connection = getConnectionString();
if (!connection) {
  console.error('Missing Postgres connection string. Set SUPABASE_DB_URL, SUPABASE_DATABASE_URL, DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

let failures = 0;

try {
  await withDbClient(async (client) => {
  console.log(`Validating church management schema using ${connection.name}...`);

  const { rows: tables } = await client.query(
    `
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname = any($1::text[])
    `,
    [requiredTables],
  );
  const tableMap = new Map(tables.map((row) => [row.relname, row]));

  for (const table of requiredTables) {
    const row = tableMap.get(table);
    const exists = Boolean(row);
    const rlsEnabled = Boolean(row?.relrowsecurity);
    printCheck(`table public.${table}`, exists);
    printCheck(`RLS enabled public.${table}`, exists && rlsEnabled);
    if (!exists || !rlsEnabled) failures += 1;
  }

  const { rows: functions } = await client.query(
    `
      select p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = any($1::text[])
    `,
    [requiredFunctions],
  );
  const functionNames = new Set(functions.map((row) => row.proname));
  for (const fn of requiredFunctions) {
    const exists = functionNames.has(fn);
    printCheck(`function public.${fn}`, exists);
    if (!exists) failures += 1;
  }

  const { rows: columns } = await client.query(
    `
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [[...new Set(requiredColumns.map(([table]) => table))]],
  );
  const columnNames = new Set(columns.map((row) => `${row.table_name}:${row.column_name}`));
  for (const [table, column] of requiredColumns) {
    const exists = columnNames.has(`${table}:${column}`);
    printCheck(`column public.${table}.${column}`, exists);
    if (!exists) failures += 1;
  }

  const { rows: policies } = await client.query(
    `
      select tablename, policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = any($1::text[])
    `,
    [requiredTables],
  );
  const policyNames = new Set(policies.map((row) => `${row.tablename}:${row.policyname}`));
  for (const [table, policy] of requiredPolicies) {
    const exists = policyNames.has(`${table}:${policy}`);
    printCheck(`policy ${table}.${policy}`, exists);
    if (!exists) failures += 1;
  }
  });
} catch (error) {
  console.error(`Could not validate church management schema using ${connection.name}: ${error.message}`);
  process.exit(1);
}

if (failures > 0) {
  console.error(`Church management schema validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('Church management schema validation passed.');

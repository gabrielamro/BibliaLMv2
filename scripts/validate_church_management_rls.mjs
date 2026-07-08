import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const rlsMatrix = [
  {
    profile: 'gestor',
    tables: ['church_member_roles', 'church_service_teams', 'church_assignments', 'church_qr_forms', 'church_form_submissions', 'church_management_notifications', 'church_notification_events', 'church_management_settings', 'church_analytics_snapshots'],
    requiredPolicies: ['Church managers manage roles', 'Church operators manage QR forms', 'Church managers manage settings'],
  },
  {
    profile: 'pastor',
    tables: ['church_form_submissions', 'church_management_notifications', 'church_notification_events', 'church_analytics_snapshots'],
    requiredPolicies: ['Authorized users update submissions', 'Church analytics readable by operators'],
  },
  {
    profile: 'lider',
    tables: ['church_service_teams', 'church_assignments', 'church_form_submissions', 'church_management_notifications'],
    requiredPolicies: ['Church managers and leaders manage teams', 'Operators and leaders manage assignments'],
  },
  {
    profile: 'voluntario',
    tables: ['church_assignments', 'church_volunteer_badges'],
    requiredPolicies: ['Operators leaders and assignee update assignments', 'Assignees record accepted assignment badges'],
  },
  {
    profile: 'membro',
    tables: ['church_qr_forms', 'church_form_submissions'],
    requiredPolicies: ['Active QR forms public by token', 'Public can create active form submissions'],
  },
];

const connection = getConnectionString();
if (!connection) {
  console.error('Missing Postgres connection string. Set SUPABASE_DB_URL, SUPABASE_DATABASE_URL, DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

let failures = 0;

try {
  await withDbClient(async (client) => {
  console.log(`Auditing church management RLS matrix using ${connection.name}...`);

  const tableNames = [...new Set(rlsMatrix.flatMap((entry) => entry.tables))];
  const policyNames = [...new Set(rlsMatrix.flatMap((entry) => entry.requiredPolicies))];

  const { rows: tables } = await client.query(
    `
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any($1::text[])
    `,
    [tableNames],
  );
  const rlsEnabled = new Map(tables.map((row) => [row.relname, Boolean(row.relrowsecurity)]));

  const { rows: policies } = await client.query(
    `
      select tablename, policyname
      from pg_policies
      where schemaname = 'public'
        and policyname = any($1::text[])
    `,
    [policyNames],
  );
  const installedPolicies = new Set(policies.map((row) => `${row.tablename}:${row.policyname}`));

  for (const entry of rlsMatrix) {
    const tableOk = entry.tables.every((table) => rlsEnabled.get(table));
    const policyOk = entry.requiredPolicies.every((policy) => policies.some((row) => row.policyname === policy));
    printCheck(`RLS matrix profile ${entry.profile}`, tableOk && policyOk, `${entry.tables.length} table(s), ${entry.requiredPolicies.length} policy check(s)`);
    if (!tableOk || !policyOk) failures += 1;
  }

  for (const row of policies) {
    printCheck(`installed policy ${row.tablename}.${row.policyname}`, installedPolicies.has(`${row.tablename}:${row.policyname}`));
  }
  });
} catch (error) {
  console.error(`Could not audit church management RLS using ${connection.name}: ${error.message}`);
  process.exit(1);
}

if (failures > 0) {
  console.error(`Church management RLS audit failed with ${failures} profile issue(s).`);
  process.exit(1);
}

console.log('Church management RLS audit passed.');

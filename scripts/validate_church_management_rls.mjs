import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const rlsMatrix = [
  {
    profile: 'gestor',
    tables: ['church_member_roles', 'church_service_teams', 'church_assignments', 'church_qr_forms', 'church_form_submissions', 'church_management_notifications', 'church_notification_events', 'church_management_settings', 'church_analytics_snapshots'],
    requiredPolicies: [
      'Church managers manage roles',
      'Scoped roles create QR forms',
      'Scoped roles update QR forms',
      'Scoped roles delete QR forms',
      'Church managers manage settings',
    ],
  },
  {
    profile: 'pastor',
    tables: ['church_form_submissions', 'church_management_notifications', 'church_notification_events', 'church_analytics_snapshots'],
    requiredPolicies: ['Authorized scoped roles update submissions', 'Church analytics readable by managers'],
  },
  {
    profile: 'lider',
    tables: ['church_service_teams', 'church_assignments', 'church_form_submissions', 'church_management_notifications'],
    requiredPolicies: ['Managers or scoped leaders update teams', 'Operators and leaders manage assignments'],
  },
  {
    profile: 'voluntario',
    tables: ['church_assignments', 'church_volunteer_badges'],
    requiredPolicies: ['Scoped operators and assignee update assignments', 'Assignees record accepted assignment badges'],
  },
  {
    profile: 'membro',
    tables: ['church_qr_forms', 'church_form_submissions'],
    requiredPolicies: ['Anonymous users read active QR forms', 'Public can create active form submissions'],
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
    const missingTables = entry.tables.filter((table) => !rlsEnabled.get(table));
    const missingPolicies = entry.requiredPolicies.filter((policy) => !policies.some((row) => row.policyname === policy));
    const tableOk = missingTables.length === 0;
    const policyOk = missingPolicies.length === 0;
    const details = [
      missingTables.length ? `RLS ausente: ${missingTables.join(', ')}` : null,
      missingPolicies.length ? `políticas ausentes: ${missingPolicies.join(', ')}` : null,
    ].filter(Boolean).join('; ') || `${entry.tables.length} table(s), ${entry.requiredPolicies.length} policy check(s)`;
    printCheck(`RLS matrix profile ${entry.profile}`, tableOk && policyOk, details);
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

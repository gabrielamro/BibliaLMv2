import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const requiredProfiles = [
  ['gestor', 'CHURCH_RLS_MANAGER_ID', ['church_manager']],
  ['pastor', 'CHURCH_RLS_PASTOR_ID', ['pastor']],
  ['lider', 'CHURCH_RLS_LEADER_ID', ['leader']],
  ['voluntario', 'CHURCH_RLS_VOLUNTEER_ID', ['volunteer']],
  ['membro', 'CHURCH_RLS_MEMBER_ID', []],
  ['admin', 'CHURCH_RLS_ADMIN_ID', ['church_manager']],
];

const churchId = process.env.CHURCH_RLS_CHURCH_ID;
const connection = getConnectionString();

if (!connection) {
  console.error('Missing Postgres connection string. Set SUPABASE_DB_URL, SUPABASE_DATABASE_URL, DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

if (!churchId) {
  console.error('Missing CHURCH_RLS_CHURCH_ID.');
  process.exit(1);
}

const profiles = requiredProfiles
  .map(([label, envName, roles]) => ({ label, envName, userId: process.env[envName], roles }))
  .filter((profile) => profile.userId);

if (profiles.length < requiredProfiles.length) {
  const missing = requiredProfiles.map(([, envName]) => envName).filter((envName) => !process.env[envName]);
  console.error(`Missing RLS profile user id(s): ${missing.join(', ')}`);
  process.exit(1);
}

let failures = 0;

async function runAsUser(client, userId, callback) {
  await client.query('begin');
  try {
    await client.query('set local role authenticated');
    await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await client.query(`select set_config('request.jwt.claim.role', 'authenticated', true)`);
    await callback();
    await client.query('rollback');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

try {
  await withDbClient(async (client) => {
    console.log(`Testing church management RLS profiles using ${connection.name}...`);

    for (const profile of profiles) {
      await runAsUser(client, profile.userId, async () => {
        const { rows: roleRows } = await client.query(
          `select public.has_church_role($1::uuid, $2::text[]) as allowed`,
          [churchId, profile.roles.length ? profile.roles : ['church_manager']],
        );
        const expectedRole = profile.roles.length > 0;
        const roleOk = Boolean(roleRows[0]?.allowed) === expectedRole;
        printCheck(`${profile.label} expected role visibility`, roleOk);
        if (!roleOk) failures += 1;

        const readableTables = [
          'church_assignments',
          'church_qr_forms',
          'church_form_submissions',
          'church_management_notifications',
        ];

        for (const table of readableTables) {
          try {
            await client.query(`select id from public.${table} where church_id = $1::uuid limit 1`, [churchId]);
            printCheck(`${profile.label} select ${table}`, true);
          } catch (error) {
            const expectedBlock = profile.label === 'membro' && table !== 'church_qr_forms';
            printCheck(`${profile.label} select ${table}`, expectedBlock, expectedBlock ? 'blocked as expected' : error.message);
            if (!expectedBlock) failures += 1;
          }
        }
      });
    }
  });
} catch (error) {
  console.error(`Could not test church management RLS profiles using ${connection.name}: ${error.message}`);
  process.exit(1);
}

if (failures > 0) {
  console.error(`Church management RLS profile test failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('Church management RLS profile test passed.');

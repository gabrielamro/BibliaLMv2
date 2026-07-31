import { getConnectionString, printCheck, withDbClient } from './lib/churchManagementDb.mjs';

const requiredTables = [
  'church_services',
  'service_checkins',
  'service_visits',
  'service_notes',
  'service_reactions',
  'service_prayer_requests',
  'service_prayer_intercessions',
  'service_verse_saves',
  'service_ministries',
  'service_ministry_members',
  'service_schedule_assignments',
  'service_live_states',
  'service_ai_contents',
  'service_public_invites',
  'service_prayer_timeline_events',
  'service_liturgy_comments',
];

const requiredColumns = [
  ['church_services', 'status'],
  ['church_services', 'liturgy_items'],
  ['church_services', 'live_url'],
  ['church_services', 'checkins_count'],
  ['church_services', 'posts_count'],
  ['service_live_states', 'current_item_id'],
  ['service_schedule_assignments', 'status'],
  ['posts', 'service_id'],
  ['posts', 'service_title'],
  ['service_public_invites', 'token'],
  ['service_public_invites', 'status'],
  ['service_public_invites', 'invited_by_user_id'],
  ['service_public_invites', 'invited_user_id'],
  ['service_prayer_timeline_events', 'content_preview'],
  ['service_prayer_timeline_events', 'is_private'],
  ['service_liturgy_comments', 'liturgy_item_id'],
  ['service_liturgy_comments', 'content'],
];

const requiredPolicies = [
  ['church_services', 'Anonymous users read published church services'],
  ['church_services', 'Authenticated users read allowed church services'],
  ['church_services', 'Church managers create services'],
  ['church_services', 'Church managers update services'],
  ['service_checkins', 'Users can check in themselves'],
  ['service_notes', 'Users can read own service notes'],
  ['service_notes', 'Users can delete own service notes'],
  ['service_reactions', 'Users can react to services'],
  ['service_prayer_requests', 'Users can create service prayer requests'],
  ['service_prayer_intercessions', 'Users can intercede service prayers'],
  ['service_verse_saves', 'Users can save service key verse'],
  ['service_public_invites', 'Public can read service invites by token'],
  ['service_public_invites', 'Authenticated users can create service invites'],
  ['service_public_invites', 'Invite actors can update service invites'],
  ['service_prayer_timeline_events', 'Public can read redacted service prayer timeline'],
  ['service_liturgy_comments', 'Public can read service liturgy comments'],
  ['service_liturgy_comments', 'Users can create one comment per liturgy moment'],
  ['service_liturgy_comments', 'Users can update own liturgy comment'],
  ['service_liturgy_comments', 'Users can delete own liturgy comment'],
];

const requiredIndexes = [
  'church_services_church_id_starts_at_idx',
  'church_services_public_status_starts_at_idx',
  'church_services_slug_status_idx',
  'service_checkins_service_id_idx',
  'service_visits_service_id_idx',
  'service_notes_service_user_idx',
  'service_reactions_service_id_idx',
  'service_reactions_service_created_at_idx',
  'service_reactions_user_id_idx',
  'service_prayer_requests_service_id_idx',
  'service_schedule_assignments_service_id_idx',
  'service_live_states_church_id_idx',
  'service_public_invites_service_status_idx',
  'service_public_invites_token_idx',
  'service_prayer_timeline_service_created_idx',
  'service_liturgy_comments_service_item_created_idx',
  'service_prayer_timeline_events_church_id_idx',
  'service_liturgy_comments_church_id_idx',
  'service_liturgy_comments_user_id_idx',
];

const requiredGrants = [
  ['church_services', 'anon', 'SELECT'],
  ['church_services', 'authenticated', 'SELECT'],
  ['church_services', 'authenticated', 'UPDATE'],
  ['service_visits', 'anon', 'INSERT'],
  ['service_checkins', 'authenticated', 'INSERT'],
  ['service_notes', 'authenticated', 'INSERT'],
  ['service_live_states', 'authenticated', 'UPDATE'],
  ['service_public_invites', 'anon', 'SELECT'],
  ['service_public_invites', 'authenticated', 'INSERT'],
  ['service_public_invites', 'authenticated', 'UPDATE'],
  ['service_prayer_timeline_events', 'anon', 'SELECT'],
  ['service_liturgy_comments', 'anon', 'SELECT'],
  ['service_liturgy_comments', 'authenticated', 'INSERT'],
];

const requiredRealtimeTables = [
  'church_services',
  'service_live_states',
  'service_reactions',
  'service_prayer_requests',
  'posts',
  'service_checkins',
  'service_visits',
  'service_verse_saves',
  'service_schedule_assignments',
  'service_prayer_timeline_events',
  'service_liturgy_comments',
];

const connection = getConnectionString();
if (!connection) {
  console.error('Missing Postgres connection string. Set SUPABASE_DB_URL, SUPABASE_DATABASE_URL, DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

let failures = 0;

try {
  await withDbClient(async (client) => {
    console.log(`Validating Culto+ schema using ${connection.name}...`);

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

    const { rows: constraints } = await client.query(
      `
        select conname
        from pg_constraint
        where conrelid = 'public.church_services'::regclass
          and conname = 'church_services_status_check'
      `,
    );
    const hasStatusConstraint = constraints.length > 0;
    printCheck('constraint public.church_services.church_services_status_check', hasStatusConstraint);
    if (!hasStatusConstraint) failures += 1;

    const { rows: reactionUniquenessConstraints } = await client.query(
      `
        select conname
        from pg_constraint
        where conrelid = 'public.service_reactions'::regclass
          and conname = 'service_reactions_service_id_user_id_reaction_type_key'
      `,
    );
    const repeatedReactionsEnabled = reactionUniquenessConstraints.length === 0;
    printCheck('service reactions accept repeated events from the same user', repeatedReactionsEnabled);
    if (!repeatedReactionsEnabled) failures += 1;

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

    const { rows: indexes } = await client.query(
      `
        select indexname
        from pg_indexes
        where schemaname = 'public'
          and indexname = any($1::text[])
      `,
      [requiredIndexes],
    );
    const indexNames = new Set(indexes.map((row) => row.indexname));
    for (const indexName of requiredIndexes) {
      const exists = indexNames.has(indexName);
      printCheck(`index public.${indexName}`, exists);
      if (!exists) failures += 1;
    }

    for (const [table, role, privilege] of requiredGrants) {
      const { rows } = await client.query(
        `
          select has_table_privilege($1, $2, $3) as allowed
        `,
        [role, `public.${table}`, privilege],
      );
      const allowed = Boolean(rows[0]?.allowed);
      printCheck(`grant ${privilege} on public.${table} to ${role}`, allowed);
      if (!allowed) failures += 1;
    }

    const { rows: realtimeTables } = await client.query(
      `
        select tablename
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = any($1::text[])
      `,
      [requiredRealtimeTables],
    );
    const realtimeTableNames = new Set(realtimeTables.map((row) => row.tablename));
    for (const table of requiredRealtimeTables) {
      const exists = realtimeTableNames.has(table);
      printCheck(`realtime publication public.${table}`, exists);
      if (!exists) failures += 1;
    }
  });
} catch (error) {
  console.error(`Could not validate Culto+ schema using ${connection.name}: ${error.message}`);
  process.exit(1);
}

if (failures > 0) {
  console.error(`Culto+ schema validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('Culto+ schema validation passed.');

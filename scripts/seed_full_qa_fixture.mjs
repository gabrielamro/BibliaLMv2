import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const MODE = process.argv.find((argument) => argument.startsWith('--')) ?? '--plan';
const FIXTURE_KEY = 'cultoplus_full_qa_v1';
const MANIFEST_PATH = resolve(process.cwd(), '.qa-fixture.local.json');
const CHURCH_ID = 'b1000000-0000-4000-8000-000000000001';
const CELL_ID = 'c1000000-0000-4000-8000-000000000001';
const NOW = Date.now();

const uuid = (prefix, index) =>
  `${prefix}000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const isoDays = (days, hour = 19) => {
  const date = new Date(NOW + days * 86_400_000);
  date.setUTCHours(hour + 4, 0, 0, 0);
  return date.toISOString();
};

const personas = [
  {
    key: 'member',
    id: uuid('a1', 1),
    email: 'qa.member.cultoplus@example.com',
    username: 'qa_member_cultoplus',
    displayName: 'QA Membro',
    profileType: 'user',
    tier: 'free',
    churchMember: true,
  },
  {
    key: 'pastor',
    id: uuid('a1', 2),
    email: 'qa.pastor.cultoplus@example.com',
    username: 'qa_pastor_cultoplus',
    displayName: 'QA Pastor',
    profileType: 'pastor',
    tier: 'pastor',
    churchMember: true,
  },
  {
    key: 'manager',
    id: uuid('a1', 3),
    email: 'qa.manager.cultoplus@example.com',
    username: 'qa_gestor_cultoplus',
    displayName: 'QA Gestor',
    profileType: 'manager',
    tier: 'gold',
    churchMember: true,
  },
  {
    key: 'leader',
    id: uuid('a1', 4),
    email: 'qa.leader.cultoplus@example.com',
    username: 'qa_lider_cultoplus',
    displayName: 'QA Líder',
    profileType: 'user',
    tier: 'free',
    churchMember: true,
  },
  {
    key: 'guest',
    id: uuid('a1', 5),
    email: 'qa.guest.cultoplus@example.com',
    username: 'qa_visitante_cultoplus',
    displayName: 'QA Visitante',
    profileType: 'user',
    tier: 'free',
    churchMember: false,
  },
];

const people = Object.fromEntries(personas.map((persona) => [persona.key, persona]));
const teams = {
  reception: { id: uuid('d1', 1), name: 'Recepção', slug: 'qa-recepcao' },
  worship: { id: uuid('d1', 2), name: 'Louvor', slug: 'qa-louvor' },
  media: { id: uuid('d1', 3), name: 'Mídia', slug: 'qa-midia' },
};
const functions = {
  receptionist: uuid('e1', 1),
  integration: uuid('e1', 2),
  support: uuid('e1', 3),
  vocal: uuid('e1', 4),
  guitar: uuid('e1', 5),
  keyboard: uuid('e1', 6),
  projection: uuid('e1', 7),
  photography: uuid('e1', 8),
  streaming: uuid('e1', 9),
};
const services = {
  draft: 'qa-service-draft',
  noTeam: 'qa-service-no-team',
  waitingVolunteers: 'qa-service-waiting-volunteers',
  awaitingConfirmation: 'qa-service-awaiting-confirmation',
  checkin: 'qa-service-checkin-open',
  live: 'qa-service-live',
  complete: 'qa-service-complete',
  archived: 'qa-service-archived',
};
const forms = {
  prayer: uuid('11', 1),
  volunteer: uuid('11', 2),
  visitor: uuid('11', 3),
  pastorCare: uuid('11', 4),
  group: uuid('11', 5),
  custom: uuid('11', 6),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DATABASE_URL no arquivo .env.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const readCredentials = () => {
  if (existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    if (manifest.fixtureKey === FIXTURE_KEY && manifest.credentials) return manifest.credentials;
  }
  return Object.fromEntries(personas.map((persona) => [
    persona.key,
    `${randomBytes(18).toString('base64url')}Aa1!`,
  ]));
};

const credentials = readCredentials();

const withDatabase = async (callback) => {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
};

const assertResult = (result, context) => {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
};

const upsert = async (table, rows, onConflict = 'id') => {
  if (!rows.length) return [];
  const result = await admin.from(table).upsert(rows, { onConflict }).select();
  return assertResult(result, `Falha ao gravar ${table}`) ?? [];
};

const removeWhere = async (table, column, values) => {
  if (!values.length) return;
  const result = await admin.from(table).delete().in(column, values);
  if (result.error && result.error.code !== '42P01' && result.error.code !== 'PGRST205') {
    throw new Error(`Falha ao limpar ${table}: ${result.error.message}`);
  }
};

async function ensureAuthUsers() {
  const createdThisRun = [];
  try {
    for (const persona of personas) {
      const existing = await admin.auth.admin.getUserById(persona.id);
      if (!existing.data?.user) {
        const created = await admin.auth.admin.createUser({
          id: persona.id,
          email: persona.email,
          password: credentials[persona.key],
          email_confirm: true,
          user_metadata: {
            display_name: persona.displayName,
            username: persona.username,
            fixture_key: FIXTURE_KEY,
          },
          app_metadata: {
            fixture_key: FIXTURE_KEY,
            qa_persona: persona.key,
          },
        });
        assertResult(created, `Falha ao criar ${persona.key}`);
        createdThisRun.push(persona.id);
      } else {
        assertResult(await admin.auth.admin.updateUserById(persona.id, {
          email: persona.email,
          password: credentials[persona.key],
          email_confirm: true,
          user_metadata: {
            ...(existing.data.user.user_metadata ?? {}),
            display_name: persona.displayName,
            username: persona.username,
            fixture_key: FIXTURE_KEY,
          },
          app_metadata: {
            ...(existing.data.user.app_metadata ?? {}),
            fixture_key: FIXTURE_KEY,
            qa_persona: persona.key,
          },
        }), `Falha ao atualizar ${persona.key}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/invalid jwt|unrecognized jwt kid|token is unverifiable/i.test(message)) {
      await ensureAuthUsersViaDatabase();
      return;
    }
    await Promise.all(createdThisRun.map((id) => admin.auth.admin.deleteUser(id)));
    throw error;
  }
}

async function ensureAuthUsersViaDatabase() {
  await withDatabase(async (client) => {
    await client.query('begin');
    try {
      for (const persona of personas) {
        const appMetadata = {
          provider: 'email',
          providers: ['email'],
          fixture_key: FIXTURE_KEY,
          qa_persona: persona.key,
        };
        const userMetadata = {
          display_name: persona.displayName,
          username: persona.username,
          fixture_key: FIXTURE_KEY,
          email_verified: true,
        };
        await client.query(
          `insert into auth.users (
             instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
             confirmation_token, recovery_token, email_change_token_new, email_change,
             raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
             phone, phone_change, phone_change_token, email_change_token_current,
             reauthentication_token, is_sso_user, is_anonymous
           ) values (
             '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated',
             $2, crypt($3, gen_salt('bf')), now(), '', '', '', '',
             $4::jsonb, $5::jsonb, now(), now(), null, '', '', '', '', false, false
           )
           on conflict (id) do update set
             email = excluded.email,
             encrypted_password = excluded.encrypted_password,
             email_confirmed_at = now(),
             raw_app_meta_data = excluded.raw_app_meta_data,
             raw_user_meta_data = excluded.raw_user_meta_data,
             updated_at = now(),
             deleted_at = null`,
          [persona.id, persona.email, credentials[persona.key], JSON.stringify(appMetadata), JSON.stringify(userMetadata)],
        );
        await client.query(
          `insert into auth.identities (
             id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
           ) values (
             $1::uuid, $1::text, $1::uuid, $2::jsonb, 'email', now(), now(), now()
           )
           on conflict (provider_id, provider) do update set
             user_id = excluded.user_id,
             identity_data = excluded.identity_data,
             updated_at = now()`,
          [persona.id, JSON.stringify({
            sub: persona.id,
            email: persona.email,
            email_verified: true,
            phone_verified: false,
          })],
        );
      }
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  });
  console.log('info Contas QA criadas pelo banco após indisponibilidade da API administrativa do Auth.');
}

async function deleteAuthUsersViaDatabase() {
  await withDatabase(async (client) => {
    await client.query(
      'delete from auth.users where id = any($1::uuid[]) or lower(email) = any($2::text[])',
      [personas.map((persona) => persona.id), personas.map((persona) => persona.email.toLowerCase())],
    );
  });
}

async function cleanupData({ deleteUsers = false } = {}) {
  const userIds = personas.map((persona) => persona.id);
  const churchScopedTables = [
    'church_notification_events',
    'church_management_notifications',
    'church_participation_logs',
    'church_service_invites',
    'church_service_scale_slots',
    'church_team_functions',
    'church_assignments',
    'church_form_submissions',
    'church_qr_forms',
    'church_volunteer_badges',
    'church_member_roles',
    'service_schedule_assignments',
    'service_ministry_members',
    'service_ministries',
    'service_liturgy_comments',
    'service_checkins',
    'service_prayer_requests',
    'church_services',
    'church_service_teams',
    'memberships',
    'church_followers',
  ];

  await removeWhere('plan_participants', 'uid', userIds);
  await removeWhere('posts', 'user_id', userIds);
  await removeWhere('prayer_requests', 'user_id', userIds);
  await removeWhere('guided_prayers', 'author_id', userIds);
  await removeWhere('studies', 'user_id', userIds);
  await removeWhere('custom_plans', 'author_id', userIds);
  await removeWhere('custom_quizzes', 'author_id', userIds);
  await removeWhere('notes', 'user_id', userIds);
  await removeWhere('service_notes', 'user_id', userIds);
  await removeWhere('mana_events', 'user_id', userIds);
  await removeWhere('notifications', 'user_id', userIds);
  for (const table of churchScopedTables) await removeWhere(table, 'church_id', [CHURCH_ID]);
  await removeWhere('cells', 'church_id', [CHURCH_ID]);
  await removeWhere('churches', 'id', [CHURCH_ID]);
  await removeWhere('profiles', 'id', userIds);

  if (deleteUsers) {
    let needsDatabaseFallback = false;
    for (const persona of personas) {
      const result = await admin.auth.admin.deleteUser(persona.id);
      if (result.error && /invalid jwt|unrecognized jwt kid|token is unverifiable/i.test(result.error.message)) {
        needsDatabaseFallback = true;
        break;
      }
      if (result.error && !/not found/i.test(result.error.message)) {
        throw new Error(`Falha ao remover ${persona.key}: ${result.error.message}`);
      }
    }
    if (needsDatabaseFallback) await deleteAuthUsersViaDatabase();
  }
}

async function seedCore() {
  await upsert('profiles', personas.map((persona, index) => ({
    id: persona.id,
    username: persona.username,
    display_name: persona.displayName,
    email: persona.email,
    phone_number: `(92) 99000-${String(index + 1).padStart(4, '0')}`,
    instagram: `@${persona.username}`,
    bio: `[QA] Persona ${persona.key} para validação integral do Culto+.`,
    city: 'Manaus',
    state: 'AM',
    profile_type: persona.profileType,
    subscription_tier: persona.tier,
    subscription_status: 'active',
    lifetime_xp: [180, 1200, 2500, 900, 40][index],
    credits: [10, 100, 999, 30, 2][index],
    theme: index % 2 ? 'dark' : 'light',
    is_profile_public: true,
    badges: [{ key: 'qa_fixture', title: 'Explorador Culto+' }],
    stats: { streak: index + 1, chaptersRead: (index + 1) * 7 },
    progress: { 'reading-plan-qa': Math.min(100, (index + 1) * 20) },
    last_reading_position: { bookId: 'jo', chapter: 14, verse: index + 1 },
    church_data: persona.churchMember ? { churchId: CHURCH_ID, fixtureKey: FIXTURE_KEY } : {},
  })));

  await upsert('churches', [{
    id: CHURCH_ID,
    name: '[QA] Igreja Cenário Culto+',
    acronym: 'QAC+',
    slug: 'qa-igreja-cenario-cultoplus',
    denomination: 'Igreja de teste',
    location_city: 'Manaus',
    location_state: 'AM',
    location_address: 'Ambiente isolado de homologação',
    pastor_name: people.pastor.displayName,
    verification_status: 'verified',
    admins: [people.manager.id],
    teams: Object.values(teams).map((team) => team.name),
    team_scores: { Recepção: 92, Louvor: 87, Mídia: 64 },
    created_by: people.manager.id,
  }]);

  await upsert('cells', [{
    id: CELL_ID,
    church_id: CHURCH_ID,
    name: '[QA] Célula Esperança',
    leader_id: people.leader.id,
    leader_name: people.leader.displayName,
    created_by: people.manager.id,
    privacy: 'public',
  }]);

  await upsert('memberships', personas.filter((persona) => persona.churchMember).map((persona) => ({
    user_id: persona.id,
    church_id: CHURCH_ID,
    cell_id: persona.key === 'member' || persona.key === 'leader' ? CELL_ID : null,
    role: persona.key === 'pastor' ? 'pastor' : persona.key === 'manager' ? 'admin' : 'member',
    joined_at: isoDays(-120),
  })), 'user_id');

  await upsert('church_followers', [
    { id: uuid('12', 1), user_id: people.guest.id, church_id: CHURCH_ID, followed_at: isoDays(-5) },
    { id: uuid('12', 2), user_id: people.member.id, church_id: CHURCH_ID, followed_at: isoDays(-90) },
  ]);

  await upsert('church_service_teams', [
    { ...teams.reception, church_id: CHURCH_ID, area: 'Boas-vindas', description: 'Acolhimento e integração.', leader_id: people.manager.id, status: 'active', capacity: 12, created_by: people.manager.id },
    { ...teams.worship, church_id: CHURCH_ID, area: 'Celebração', description: 'Música e condução do louvor.', leader_id: people.leader.id, status: 'active', capacity: 10, created_by: people.manager.id },
    { ...teams.media, church_id: CHURCH_ID, area: 'Comunicação', description: 'Projeção, fotografia e transmissão.', leader_id: null, status: 'active', capacity: 8, created_by: people.manager.id },
  ]);

  await upsert('church_member_roles', [
    { id: uuid('13', 1), church_id: CHURCH_ID, user_id: people.manager.id, role: 'church_manager', scope_type: 'church', scope_id: null, status: 'active', granted_by: people.manager.id, meta: { fixtureKey: FIXTURE_KEY } },
    { id: uuid('13', 2), church_id: CHURCH_ID, user_id: people.pastor.id, role: 'pastor', scope_type: 'church', scope_id: null, status: 'active', granted_by: people.manager.id, meta: { fixtureKey: FIXTURE_KEY } },
    { id: uuid('13', 3), church_id: CHURCH_ID, user_id: people.manager.id, role: 'leader', scope_type: 'team', scope_id: teams.reception.id, status: 'active', granted_by: people.manager.id, meta: { fixtureKey: FIXTURE_KEY } },
    { id: uuid('13', 4), church_id: CHURCH_ID, user_id: people.manager.id, role: 'volunteer', scope_type: 'team', scope_id: teams.reception.id, status: 'active', granted_by: people.manager.id, meta: { team_function_name: 'Integração' } },
    { id: uuid('13', 5), church_id: CHURCH_ID, user_id: people.leader.id, role: 'leader', scope_type: 'team', scope_id: teams.worship.id, status: 'active', granted_by: people.manager.id, meta: { fixtureKey: FIXTURE_KEY } },
    { id: uuid('13', 6), church_id: CHURCH_ID, user_id: people.leader.id, role: 'volunteer', scope_type: 'team', scope_id: teams.worship.id, status: 'active', granted_by: people.manager.id, meta: { team_function_name: 'Vocal' } },
    { id: uuid('13', 7), church_id: CHURCH_ID, user_id: people.member.id, role: 'volunteer', scope_type: 'team', scope_id: teams.reception.id, status: 'paused', granted_by: people.manager.id, meta: { fixtureKey: FIXTURE_KEY } },
    { id: uuid('13', 8), church_id: CHURCH_ID, user_id: people.member.id, role: 'volunteer', scope_type: 'team', scope_id: teams.media.id, status: 'revoked', granted_by: people.manager.id, revoked_at: isoDays(-20), meta: { fixtureKey: FIXTURE_KEY } },
  ]);
}

async function seedChurchOperations() {
  const teamFunctions = [
    [functions.receptionist, teams.reception.id, 'Recepcionista', 'Recebe pessoas na entrada.', 2],
    [functions.integration, teams.reception.id, 'Integração', 'Acompanha visitantes.', 1],
    [functions.support, teams.reception.id, 'Apoio', 'Suporte ao fluxo do templo.', 1],
    [functions.vocal, teams.worship.id, 'Vocal', 'Condução vocal.', 2],
    [functions.guitar, teams.worship.id, 'Violão', 'Base harmônica.', 1],
    [functions.keyboard, teams.worship.id, 'Teclado', 'Base e ambientação.', 1],
    [functions.projection, teams.media.id, 'Projeção', 'Slides e letras.', 1],
    [functions.photography, teams.media.id, 'Fotografia', 'Registro do culto.', 1],
    [functions.streaming, teams.media.id, 'Transmissão', 'Operação da live.', 1],
  ].map(([id, teamId, name, description, requiredCount]) => ({
    id, church_id: CHURCH_ID, team_id: teamId, name, description,
    required_count: requiredCount, profile_hint: 'Pessoa disponível e alinhada com a equipe.',
    status: 'active', created_by: people.manager.id,
  }));
  await upsert('church_team_functions', teamFunctions);

  const serviceRows = [
    [services.draft, 'Culto em preparação', 'Planejamento pastoral', 'draft', -2],
    [services.noTeam, 'Culto sem equipe', 'Primeiros passos', 'published', 2],
    [services.waitingVolunteers, 'Culto aguardando voluntários', 'Servir com alegria', 'published', 4],
    [services.awaitingConfirmation, 'Culto aguardando confirmações', 'Compromisso e comunhão', 'published', 6],
    [services.checkin, 'Culto com check-in aberto', 'Uma família em Cristo', 'checkin_open', 8],
    [services.live, 'Culto em andamento', 'Esperança viva', 'live', 10],
    [services.complete, 'Culto concluído 100%', 'Gratidão', 'finished', -7],
    [services.archived, 'Culto arquivado', 'Memória da comunidade', 'archived', -30],
  ].map(([id, title, theme, status, days], index) => ({
    id,
    church_id: CHURCH_ID,
    church_name: '[QA] Igreja Cenário Culto+',
    church_slug: 'qa-igreja-cenario-cultoplus',
    title,
    theme,
    preacher_name: index % 2 ? people.pastor.displayName : people.manager.displayName,
    service_type: index % 2 ? 'midweek' : 'sunday',
    starts_at: isoDays(days),
    ends_at: isoDays(days, 21),
    key_verse_ref: index % 2 ? 'Filipenses 4:6-7' : 'João 14:1',
    key_verse_text: 'Não se turbe o vosso coração; crede em Deus.',
    status,
    slug: `qa-${id}`,
    created_by: people.manager.id,
    liturgy_items: [
      { id: `${id}-welcome`, type: 'welcome', title: 'Boas-vindas', startsAt: isoDays(days), durationMinutes: 10 },
      { id: `${id}-word`, type: 'sermon', title: 'Palavra', startsAt: isoDays(days, 20), durationMinutes: 45 },
    ],
    checkins_count: status === 'finished' ? 42 : status === 'checkin_open' ? 8 : 0,
    posts_count: status === 'finished' ? 3 : 0,
    live_url: status === 'live' ? 'https://www.youtube.com/watch?v=qa-cultoplus' : null,
  }));
  await upsert('church_services', serviceRows);

  await upsert('service_ministries', [
    { id: 'qa-ministry-reception', church_id: CHURCH_ID, name: 'Recepção', description: '[QA] Ministério integrado à equipe.', created_by: people.manager.id },
    { id: 'qa-ministry-worship', church_id: CHURCH_ID, name: 'Louvor', description: '[QA] Ministério integrado à equipe.', created_by: people.manager.id },
    { id: 'qa-ministry-media', church_id: CHURCH_ID, name: 'Mídia', description: '[QA] Ministério integrado à equipe.', created_by: people.manager.id },
  ]);

  await upsert('service_ministry_members', [
    { id: 'qa-ministry-member-manager', ministry_id: 'qa-ministry-reception', church_id: CHURCH_ID, user_id: people.manager.id, user_display_name: people.manager.displayName, role: 'Líder' },
    { id: 'qa-ministry-member-leader', ministry_id: 'qa-ministry-worship', church_id: CHURCH_ID, user_id: people.leader.id, user_display_name: people.leader.displayName, role: 'Vocal' },
    { id: 'qa-ministry-member-member', ministry_id: 'qa-ministry-reception', church_id: CHURCH_ID, user_id: people.member.id, user_display_name: people.member.displayName, role: 'Recepcionista' },
  ]);

  const assignments = ['draft', 'pending', 'accepted', 'declined', 'paused', 'expired', 'removed'].map((status, index) => ({
    id: uuid('14', index + 1),
    church_id: CHURCH_ID,
    team_id: [teams.media.id, teams.reception.id, teams.reception.id, teams.worship.id, teams.media.id, teams.worship.id, teams.reception.id][index],
    title: `[QA] Designação ${status}`,
    description: `Cenário operacional no status ${status}.`,
    assignee_user_id: [null, people.member.id, people.manager.id, people.leader.id, people.member.id, people.leader.id, people.member.id][index],
    leader_user_id: index % 2 ? people.leader.id : people.manager.id,
    scope_type: index === 0 ? 'church' : 'team',
    scope_id: index === 0 ? null : [teams.reception.id, teams.reception.id, teams.worship.id, teams.media.id, teams.worship.id, teams.reception.id][index - 1],
    status,
    requires_acceptance: true,
    starts_at: isoDays(index + 1),
    ends_at: isoDays(index + 1, 21),
    public_feedback: `Situação de teste: ${status}.`,
    created_by: people.manager.id,
    accepted_at: status === 'accepted' ? isoDays(-1) : null,
    declined_at: status === 'declined' ? isoDays(-1) : null,
    source_type: 'qa_fixture',
    source_id: `${FIXTURE_KEY}:assignment:${status}`,
  }));
  assignments.push(
    {
      id: uuid('14', 20), church_id: CHURCH_ID, team_id: teams.reception.id,
      title: 'Escala Recepção', description: 'Equipe selecionada, aguardando composição.',
      assignee_user_id: null, leader_user_id: people.manager.id, scope_type: 'team',
      scope_id: teams.reception.id, status: 'accepted', requires_acceptance: true,
      starts_at: isoDays(4), ends_at: isoDays(4, 21), public_feedback: 'Equipe aprovada; faltam voluntários.',
      created_by: people.manager.id, accepted_at: isoDays(-1), declined_at: null,
      source_type: 'gestao_culto_team', source_id: `culto_team:${services.waitingVolunteers}:${teams.reception.id}`,
    },
    {
      id: uuid('14', 21), church_id: CHURCH_ID, team_id: teams.worship.id,
      title: 'Escala Louvor', description: 'Equipe selecionada e convites enviados.',
      assignee_user_id: null, leader_user_id: people.leader.id, scope_type: 'team',
      scope_id: teams.worship.id, status: 'accepted', requires_acceptance: true,
      starts_at: isoDays(6), ends_at: isoDays(6, 21), public_feedback: 'Aguardando confirmações.',
      created_by: people.manager.id, accepted_at: isoDays(-1), declined_at: null,
      source_type: 'gestao_culto_team', source_id: `culto_team:${services.awaitingConfirmation}:${teams.worship.id}`,
    },
    {
      id: uuid('14', 22), church_id: CHURCH_ID, team_id: teams.reception.id,
      title: 'Escala concluída', description: 'Equipe e voluntários confirmados.',
      assignee_user_id: people.manager.id, leader_user_id: people.manager.id, scope_type: 'team',
      scope_id: teams.reception.id, status: 'accepted', requires_acceptance: true,
      starts_at: isoDays(-7), ends_at: isoDays(-7, 21), public_feedback: 'Escala concluída.',
      created_by: people.manager.id, accepted_at: isoDays(-10), declined_at: null,
      source_type: 'gestao_culto_team', source_id: `culto_team:${services.complete}:${teams.reception.id}`,
    },
  );
  await upsert('church_assignments', assignments);

  await upsert('service_schedule_assignments', [
    { id: 'qa-schedule-pending', service_id: services.awaitingConfirmation, church_id: CHURCH_ID, ministry_id: 'qa-ministry-worship', ministry_name: 'Louvor', user_id: people.leader.id, user_display_name: people.leader.displayName, role: 'Vocal', status: 'pending' },
    { id: 'qa-schedule-confirmed', service_id: services.complete, church_id: CHURCH_ID, ministry_id: 'qa-ministry-reception', ministry_name: 'Recepção', user_id: people.manager.id, user_display_name: people.manager.displayName, role: 'Integração', status: 'confirmed' },
    { id: 'qa-schedule-declined', service_id: services.checkin, church_id: CHURCH_ID, ministry_id: 'qa-ministry-reception', ministry_name: 'Recepção', user_id: people.member.id, user_display_name: people.member.displayName, role: 'Recepcionista', status: 'declined' },
    { id: 'qa-schedule-replaced', service_id: services.live, church_id: CHURCH_ID, ministry_id: 'qa-ministry-worship', ministry_name: 'Louvor', user_id: people.leader.id, user_display_name: people.leader.displayName, role: 'Vocal', status: 'replaced', replacement_user_id: people.manager.id, replacement_user_display_name: people.manager.displayName },
  ]);

  await upsert('church_service_scale_slots', [
    { id: uuid('15', 1), church_id: CHURCH_ID, service_id: services.waitingVolunteers, team_id: teams.reception.id, function_id: functions.receptionist, function_name: 'Recepcionista', required_count: 2, assigned_count: 0, status: 'open', created_by: people.manager.id },
    { id: uuid('15', 2), church_id: CHURCH_ID, service_id: services.complete, team_id: teams.reception.id, function_id: functions.integration, function_name: 'Integração', required_count: 1, assigned_count: 1, status: 'filled', created_by: people.manager.id },
    { id: uuid('15', 3), church_id: CHURCH_ID, service_id: services.archived, team_id: teams.media.id, function_id: functions.streaming, function_name: 'Transmissão', required_count: 1, assigned_count: 0, status: 'cancelled', created_by: people.manager.id },
  ]);

  const inviteStatuses = ['not_sent', 'pending', 'confirmed', 'declined', 'expired', 'cancelled', 'conflict'];
  await upsert('church_service_invites', inviteStatuses.map((status, index) => ({
    id: uuid('16', index + 1), church_id: CHURCH_ID,
    service_id: index === 2 ? services.complete : services.awaitingConfirmation,
    team_id: index % 2 ? teams.worship.id : teams.reception.id,
    slot_id: index === 2 ? uuid('15', 2) : null,
    assignment_id: index === 2 ? uuid('14', 22) : uuid('14', 21),
    user_id: index % 2 ? people.leader.id : people.member.id,
    role: `[QA] ${index % 2 ? 'Vocal' : 'Recepcionista'} — ${status}`, status,
    response_note: `[QA] Resposta ${status}.`,
    sent_at: status === 'not_sent' ? null : isoDays(-2),
    responded_at: ['confirmed', 'declined', 'conflict'].includes(status) ? isoDays(-1) : null,
    expires_at: status === 'expired' ? isoDays(-1) : isoDays(5),
    created_by: people.manager.id,
  })));

  const participationStatuses = ['participated', 'missed', 'justified_absence', 'replaced', 'cancelled'];
  await upsert('church_participation_logs', participationStatuses.map((status, index) => ({
    id: uuid('17', index + 1), church_id: CHURCH_ID, service_id: services.complete,
    team_id: index % 2 ? teams.worship.id : teams.reception.id,
    assignment_id: uuid('14', 22), invite_id: uuid('16', Math.min(index + 1, 7)),
    user_id: index % 2 ? people.leader.id : people.manager.id,
    status, role: index % 2 ? 'Vocal' : 'Recepção',
    notes: `[QA] Participação ${status}.`, recorded_by: people.manager.id,
    recorded_at: isoDays(-7),
  })));

  await upsert('service_checkins', [
    { id: 'qa-checkin-manager', service_id: services.complete, church_id: CHURCH_ID, user_id: people.manager.id, user_display_name: people.manager.displayName, created_at: isoDays(-7) },
    { id: 'qa-checkin-member', service_id: services.complete, church_id: CHURCH_ID, user_id: people.member.id, user_display_name: people.member.displayName, created_at: isoDays(-7) },
    { id: 'qa-checkin-live-manager', service_id: services.noTeam, church_id: CHURCH_ID, user_id: people.manager.id, user_display_name: people.manager.displayName, created_at: isoDays(2) },
    { id: 'qa-checkin-live-member', service_id: services.noTeam, church_id: CHURCH_ID, user_id: people.member.id, user_display_name: people.member.displayName, created_at: isoDays(2) },
  ]);
  await upsert('service_reactions', [
    { id: uuid('31', 1), service_id: services.noTeam, user_id: people.member.id, reaction_type: 'amen', created_at: isoDays(2) },
    { id: uuid('31', 2), service_id: services.noTeam, user_id: people.leader.id, reaction_type: 'glory', created_at: isoDays(2) },
    { id: uuid('31', 3), service_id: services.noTeam, user_id: people.manager.id, reaction_type: 'hallelujah', created_at: isoDays(2) },
  ]);
  await upsert('service_notes', [{
    id: uuid('18', 1), service_id: services.complete, user_id: people.member.id,
    content: '[QA] Nota privada sobre a mensagem e aplicação prática.', tags: ['qa', 'gratidão'],
  }]);
  await upsert('service_prayer_requests', [{
    id: 'qa-service-prayer', service_id: services.complete, church_id: CHURCH_ID,
    user_id: people.member.id, user_name: people.member.displayName,
    content: '[QA] Pedido de oração compartilhado durante o culto.', is_private: false,
    intercessors_count: 2, created_at: isoDays(-7),
  }]);
  await upsert('service_prayer_requests', [
    {
      id: 'qa-live-public-prayer', service_id: services.noTeam, church_id: CHURCH_ID,
      user_id: people.member.id, user_name: people.member.displayName,
      content: '[QA] Orem por sabedoria e paz para minha familia durante esta semana.', is_private: false,
      intercessors_count: 0, created_at: isoDays(2),
    },
    {
      id: 'qa-live-private-prayer', service_id: services.noTeam, church_id: CHURCH_ID,
      user_id: people.guest.id, user_name: people.guest.displayName,
      content: '[QA PRIVADO] Este conteudo jamais pode aparecer na timeline publica.', is_private: true,
      intercessors_count: 0, created_at: isoDays(2),
    },
  ]);
  await upsert('service_liturgy_comments', [{
    id: uuid('18', 2), service_id: services.noTeam, church_id: CHURCH_ID,
    liturgy_item_id: `${services.noTeam}-welcome`, user_id: people.manager.id,
    user_name: people.manager.displayName, content: '[QA] Que bom estarmos juntos neste culto.',
    created_at: isoDays(2), updated_at: isoDays(2),
  }]);
}

async function seedFormsAndInbox() {
  const formRows = [
    [forms.prayer, 'qa-oracao-cultoplus-v1', 'Pedido de oração', 'prayer', 'active', true, 'church', null],
    [forms.volunteer, 'qa-voluntariado-recepcao-cultoplus-v1', 'Voluntariado — Recepção', 'volunteer', 'active', false, 'team', teams.reception.id],
    [forms.visitor, 'qa-visitante-cultoplus-v1', 'Sou visitante', 'visitor', 'paused', true, 'church', null],
    [forms.pastorCare, 'qa-cuidado-pastoral-cultoplus-v1', 'Cuidado pastoral', 'pastor_care', 'active', false, 'church', null],
    [forms.group, 'qa-grupo-cultoplus-v1', 'Participar de um grupo', 'group', 'expired', true, 'group', CELL_ID],
    [forms.custom, 'qa-personalizado-cultoplus-v1', 'Conexão Culto+', 'custom', 'archived', true, 'church', null],
  ].map(([id, token, title, formType, status, allowAnonymous, scopeType, scopeId], index) => ({
    id, church_id: CHURCH_ID, token, title, form_type: formType,
    description: `[QA] Formulário ${formType} para cobertura funcional.`,
    fields: [
      { id: 'name', label: 'Nome', type: 'text', required: true },
      { id: 'contact', label: 'Contato', type: 'text', required: formType !== 'prayer' },
      { id: 'message', label: formType === 'volunteer' ? 'Disponibilidade' : 'Mensagem', type: 'textarea', required: true },
    ],
    destination: formType === 'volunteer' ? `team:${teams.reception.id}` : 'inbox',
    privacy_text: 'Seus dados serão usados somente para este acompanhamento.',
    confirmation_text: 'Recebemos sua solicitação e retornaremos em breve.',
    allow_anonymous: allowAnonymous, status, scans_count: 10 + index,
    submissions_count: 2 + index, expires_at: status === 'expired' ? isoDays(-1) : isoDays(30),
    created_by: people.manager.id, scope_type: scopeType, scope_id: scopeId,
  }));
  await upsert('church_qr_forms', formRows);

  const submissionStatuses = ['received', 'assigned', 'in_progress', 'waiting_member', 'answered', 'closed', 'archived'];
  const submissions = submissionStatuses.map((status, index) => ({
    id: uuid('19', index + 1), church_id: CHURCH_ID,
    form_id: [forms.prayer, forms.visitor, forms.pastorCare, forms.group, forms.custom, forms.prayer, forms.custom][index],
    form_type: ['prayer', 'visitor', 'pastor_care', 'group', 'custom', 'prayer', 'custom'][index],
    submitter_user_id: index === 1 ? people.guest.id : people.member.id,
    submitter_name: index === 1 ? people.guest.displayName : people.member.displayName,
    submitter_contact: index === 1 ? people.guest.email : people.member.email,
    payload: { fixtureKey: FIXTURE_KEY, message: `[QA] Solicitação no status ${status}.` },
    status, public_status: `Situação: ${status}`, priority: ['low', 'normal', 'high', 'urgent'][index % 4],
    assigned_to: index > 0 ? (index % 2 ? people.pastor.id : people.manager.id) : null,
    is_sensitive: index === 2, public_feedback: index >= 4 ? 'A liderança registrou um retorno.' : '',
    internal_summary: '[QA] Resumo interno para validação do inbox.',
    next_action: status === 'waiting_member' ? 'Aguardar resposta do membro' : 'Revisar solicitação',
    closed_at: status === 'closed' ? isoDays(-1) : null,
    source_type: 'qa_fixture', source_id: `${FIXTURE_KEY}:submission:${status}`,
  }));
  submissions.push(
    {
      id: uuid('19', 20), church_id: CHURCH_ID, form_id: forms.volunteer, form_type: 'volunteer',
      submitter_user_id: people.member.id, submitter_name: people.member.displayName,
      submitter_contact: people.member.email,
      payload: { fixtureKey: FIXTURE_KEY, teamId: teams.reception.id, availability: 'Domingos à noite' },
      status: 'received', public_status: 'Aguardando análise da liderança', priority: 'high',
      assigned_to: people.manager.id, is_sensitive: false, public_feedback: '',
      internal_summary: '[QA] Candidatura pronta para aprovar ou recusar.',
      next_action: 'Aprovar e adicionar à equipe ou recusar com retorno.',
      closed_at: null, source_type: 'qa_fixture', source_id: `${FIXTURE_KEY}:volunteer:pending`,
    },
    {
      id: uuid('19', 21), church_id: CHURCH_ID, form_id: forms.volunteer, form_type: 'volunteer',
      submitter_user_id: people.leader.id, submitter_name: people.leader.displayName,
      submitter_contact: people.leader.email,
      payload: { fixtureKey: FIXTURE_KEY, teamId: teams.worship.id, availability: 'Ensaios e cultos' },
      status: 'answered', public_status: 'Aprovado para servir', priority: 'normal',
      assigned_to: people.manager.id, is_sensitive: false,
      public_feedback: 'Sua candidatura foi aprovada para a equipe Louvor, na função Vocal.',
      internal_summary: '[QA] Candidatura aprovada.', next_action: 'Aguardar contato da liderança.',
      closed_at: null, source_type: 'qa_fixture', source_id: `${FIXTURE_KEY}:volunteer:approved`,
    },
    {
      id: uuid('19', 22), church_id: CHURCH_ID, form_id: forms.volunteer, form_type: 'volunteer',
      submitter_user_id: people.member.id, submitter_name: people.member.displayName,
      submitter_contact: people.member.email,
      payload: { fixtureKey: FIXTURE_KEY, teamId: teams.reception.id, retryAllowed: true },
      status: 'answered', public_status: 'Não aprovado neste momento', priority: 'normal',
      assigned_to: people.manager.id, is_sensitive: false,
      public_feedback: 'Neste momento precisamos alinhar sua disponibilidade. Você pode tentar novamente.',
      internal_summary: '[QA] Recusa reversível.', next_action: 'Tentar novamente pelo formulário da equipe.',
      closed_at: null, source_type: 'qa_fixture', source_id: `${FIXTURE_KEY}:volunteer:rejected`,
    },
  );
  await upsert('church_form_submissions', submissions);

  const managementNotifications = [
    ['Aprovar candidatura', 'Uma nova solicitação de voluntariado aguarda decisão.', 'volunteer_submission_received', 'action', 'dashboard', null, null],
    ['Confirmar escala', 'Há um convite de escala pendente.', 'service_invite_pending', 'action', 'both', people.leader.id, null],
    ['Culto precisa de equipe', 'O culto publicado ainda não possui equipe.', 'service_configuration', 'urgent', 'dashboard', null, null],
    ['Retorno da liderança', 'Sua solicitação recebeu uma resposta.', 'volunteer_submission_declined', 'info', 'member', people.member.id, isoDays(-1)],
    ['Aviso dispensado', 'Exemplo de notificação descartada.', 'fixture_dismissed', 'info', 'dashboard', people.manager.id, null],
  ];
  await upsert('church_management_notifications', managementNotifications.map((row, index) => ({
    id: uuid('1a', index + 1), church_id: CHURCH_ID, user_id: row[5],
    audience_role: row[5] ? null : index === 2 ? 'church_manager' : 'leader',
    title: `[QA] ${row[0]}`, message: row[1], event_type: row[2],
    severity: row[3], channel: row[4], link: index === 2 ? '/gestao-igreja/cultos' : '/gestao-igreja/inbox',
    dedupe_key: `${FIXTURE_KEY}:notification:${index}`, read_at: row[6],
    dismissed_at: index === 4 ? isoDays(-1) : null,
  })));

  await upsert('church_notification_events', ['queued', 'notified', 'dismissed', 'muted'].map((status, index) => ({
    id: uuid('1b', index + 1), church_id: CHURCH_ID,
    user_id: index ? people.member.id : people.manager.id,
    audience_role: null, event_type: `qa_event_${status}`, severity: index === 0 ? 'action' : 'info',
    channel: index % 2 ? 'member' : 'dashboard', source_type: 'qa_fixture',
    source_id: FIXTURE_KEY, dedupe_key: `${FIXTURE_KEY}:event:${status}`, status,
    notification_id: uuid('1a', Math.min(index + 1, 5)),
    payload: { fixtureKey: FIXTURE_KEY, status },
  })));

  await upsert('notifications', [
    { id: uuid('1c', 1), user_id: people.member.id, title: '[QA] Candidatura recebida', message: 'A liderança recebeu sua solicitação.', type: 'info', link: '/minhas-escalas#solicitacoes', read: false, timestamp: isoDays(-1) },
    { id: uuid('1c', 2), user_id: people.leader.id, title: '[QA] Escala pendente', message: 'Confirme sua participação no próximo culto.', type: 'warning', link: '/minhas-escalas', read: false, timestamp: isoDays(-1) },
    { id: uuid('1c', 3), user_id: people.manager.id, title: '[QA] Inbox operacional', message: 'Existem itens para aprovação.', type: 'action', link: '/gestao-igreja/inbox', read: true, timestamp: isoDays(-2) },
  ]);
}

async function seedContent() {
  const postTypes = ['image', 'prayer', 'reflection', 'devotional', 'quiz', 'feeling', 'checkin', 'cell_meeting', 'podcast', 'study', 'room'];
  const visibilities = ['public', 'followers', 'church', 'group', 'private'];
  await upsert('posts', postTypes.map((type, index) => ({
    id: uuid('1d', index + 1),
    user_id: personas[index % personas.length].id,
    content: `[QA] Conteúdo ${type} para validar o card e o fluxo de publicação no Reino.`,
    image_url: type === 'image' ? 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80' : null,
    type, likes_count: index, comments_count: index % 3, shares_count: index % 2,
    church_id: ['church', 'group'].includes(visibilities[index % visibilities.length]) ? CHURCH_ID : null,
    cell_id: visibilities[index % visibilities.length] === 'group' ? CELL_ID : null,
    user_display_name: personas[index % personas.length].displayName,
    user_username: personas[index % personas.length].username,
    destination: visibilities[index % visibilities.length] === 'group' ? 'cell' : visibilities[index % visibilities.length] === 'church' ? 'church' : 'global',
    visibility: visibilities[index % visibilities.length],
    views_count: 10 + index, also_show_on_church: index % 3 === 0,
    service_id: type === 'checkin' ? services.complete : null,
    service_title: type === 'checkin' ? 'Culto concluído 100%' : null,
    source_type: `qa_${type}`, source_id: `${FIXTURE_KEY}:${type}`,
    dedupe_key: `${FIXTURE_KEY}:post:${type}`,
    metadata: {
      fixtureKey: FIXTURE_KEY,
      topic: type === 'quiz' ? 'Evangelhos' : undefined,
      score: type === 'quiz' ? 8 : undefined,
      devotionalReference: type === 'devotional' ? 'Filipenses 4:6-7' : undefined,
      roomTitle: type === 'room' ? 'Sala de oração QA' : undefined,
    },
    created_at: isoDays(-index),
  })));
  await upsert('posts', [{
    id: uuid('1d', 20),
    user_id: people.leader.id,
    content: '[QA] Que a Palavra de hoje encontre um coracao disposto a viver o Evangelho.',
    type: 'reflection',
    likes_count: 2,
    comments_count: 0,
    shares_count: 0,
    church_id: CHURCH_ID,
    user_display_name: people.leader.displayName,
    user_username: people.leader.username,
    destination: 'global',
    visibility: 'public',
    views_count: 5,
    service_id: services.noTeam,
    service_title: 'Culto sem equipe',
    source_type: 'qa_live_timeline',
    source_id: `${FIXTURE_KEY}:live-timeline`,
    dedupe_key: `${FIXTURE_KEY}:post:live-timeline`,
    metadata: { fixtureKey: FIXTURE_KEY, timeline: true },
    created_at: isoDays(2),
  }]);

  await upsert('notes', [{
    id: uuid('21', 1), user_id: people.member.id, book_id: 'jo', chapter: 14, verse: 1,
    content: '[QA] Anotação bíblica ligada à leitura e ao estudo.',
  }]);
  await upsert('prayer_requests', [{
    id: uuid('22', 1), user_id: people.member.id,
    content: '[QA] Pedido de oração da comunidade.', target_type: 'church', target_id: CHURCH_ID,
    intercessors_count: 3, cell_name: '[QA] Célula Esperança',
    intercessors: [people.pastor.id, people.leader.id], church_id: CHURCH_ID,
    user_name: people.member.displayName,
  }]);
  await upsert('guided_prayers', [{
    id: uuid('23', 1), title: '[QA] Oração guiada pela esperança',
    content: 'Respire, leia Filipenses 4:6-7 e apresente seus pedidos a Deus.',
    category: 'Paz', author_id: people.pastor.id, author_name: people.pastor.displayName,
    church_id: CHURCH_ID, is_template: false, generated_by: 'pastor',
  }]);
  await upsert('studies', [{
    id: uuid('24', 1), user_id: people.pastor.id, title: '[QA] Estudo sobre serviço',
    content: 'Um estudo completo para validar criação, leitura e publicação.',
    source_type: 'manual', is_public: true, likes_count: 4,
    blocks: JSON.stringify([{ type: 'paragraph', content: 'Servir é responder com amor.' }]),
    meta: JSON.stringify({ fixtureKey: FIXTURE_KEY }), privacy_level: 'church',
    church_id: CHURCH_ID, created_from_context: 'church',
  }]);
  await upsert('custom_plans', [{
    id: uuid('25', 1), author_id: people.pastor.id, author_name: people.pastor.displayName,
    title: '[QA] Jornada de serviço', description: 'Plano de duas semanas para equipes.',
    category: 'Discipulado', weeks: [
      { week: 1, title: 'Chamado', days: [{ day: 1, title: 'Disponibilidade', verses: ['Isaías 6:8'] }] },
      { week: 2, title: 'Comunhão', days: [{ day: 1, title: 'Um só corpo', verses: ['1 Coríntios 12:12'] }] },
    ],
    is_public: true, privacy_type: 'church', privacy_level: 'church', status: 'published',
    church_id: CHURCH_ID, group_id: null, subscribers_count: 2, planning_frequency: 'weekly',
    tags: ['qa', 'serviço'], metrics: { fixtureKey: FIXTURE_KEY }, share_slug: 'qa-jornada-servico',
  }]);
  await upsert('plan_participants', [
    { id: uuid('26', 1), plan_id: uuid('25', 1), uid: people.member.id, display_name: people.member.displayName, username: people.member.username, points: 20, completed_steps: ['w1d1'], team: 'Esperança', status: 'active', invited_by: people.pastor.id },
    { id: uuid('26', 2), plan_id: uuid('25', 1), uid: people.leader.id, display_name: people.leader.displayName, username: people.leader.username, points: 40, completed_steps: ['w1d1', 'w2d1'], team: 'Esperança', status: 'completed', invited_by: people.pastor.id },
  ]);
  await upsert('custom_quizzes', [{
    id: uuid('27', 1), author_id: people.pastor.id, title: '[QA] Quiz dos Evangelhos',
    description: 'Cobertura do quiz manual e publicação do resultado.', category: 'Evangelhos',
    type: 'manual', game_mode: 'classic', ai_config: null, is_active: true,
    questions: [
      { id: 'q1', question: 'Quem declarou: Eu sou o caminho?', options: ['Pedro', 'Jesus', 'Paulo', 'João'], correctAnswer: 1, reference: 'João 14:6' },
      { id: 'q2', question: 'Quantos evangelhos há no Novo Testamento?', options: ['3', '4', '5', '6'], correctAnswer: 1 },
    ],
  }]);
  await upsert('mana_events', personas.slice(0, 4).map((persona, index) => ({
    id: uuid('28', index + 1), user_id: persona.id, church_id: CHURCH_ID,
    group_id: index % 2 ? CELL_ID : null, actor_role: persona.key,
    action_type: ['READ_CHAPTER', 'CREATE_STUDY', 'SERVE_CHURCH', 'COMPLETE_QUIZ'][index],
    source_type: 'qa_fixture', source_id: FIXTURE_KEY,
    event_key: `${FIXTURE_KEY}:${persona.key}:${index}`, xp_amount: [10, 50, 80, 30][index],
    occurred_at: isoDays(-index), period_key: new Date().toISOString().slice(0, 10),
    status: index === 3 ? 'review' : 'valid', meta: { fixtureKey: FIXTURE_KEY },
  })));
  await upsert('church_volunteer_badges', [{
    id: uuid('29', 1), church_id: CHURCH_ID, user_id: people.leader.id,
    badge_key: 'qa_primeiro_servico', title: '[QA] Primeiro serviço',
    description: 'Reconhecimento de participação na equipe.', mana_amount: 50,
    visibility: 'church', source_type: 'qa_fixture', awarded_by: people.manager.id,
    meta: { fixtureKey: FIXTURE_KEY },
  }]);
}

async function validateFixture() {
  const checks = [];
  const count = async (table, column, values) => {
    const result = await admin.from(table).select('*', { count: 'exact', head: true }).in(column, values);
    assertResult(result, `Falha ao validar ${table}`);
    return result.count ?? 0;
  };
  const authUsersCount = await withDatabase(async (client) => {
    const result = await client.query(
      'select count(*)::integer as count from auth.users where id = any($1::uuid[]) and email_confirmed_at is not null and deleted_at is null',
      [personas.map((persona) => persona.id)],
    );
    return result.rows[0]?.count ?? 0;
  });
  checks.push(['usuários Auth', authUsersCount, 5]);
  checks.push(['perfis', await count('profiles', 'id', personas.map((persona) => persona.id)), 5]);
  checks.push(['igreja', await count('churches', 'id', [CHURCH_ID]), 1]);
  checks.push(['vínculos', await count('memberships', 'church_id', [CHURCH_ID]), 4]);
  checks.push(['equipes', await count('church_service_teams', 'church_id', [CHURCH_ID]), 3]);
  checks.push(['funções', await count('church_team_functions', 'church_id', [CHURCH_ID]), 9]);
  checks.push(['cultos', await count('church_services', 'church_id', [CHURCH_ID]), 8]);
  checks.push(['designações', await count('church_assignments', 'church_id', [CHURCH_ID]), 10]);
  checks.push(['convites de escala', await count('church_service_invites', 'church_id', [CHURCH_ID]), 7]);
  checks.push(['formulários QR', await count('church_qr_forms', 'church_id', [CHURCH_ID]), 6]);
  checks.push(['solicitações', await count('church_form_submissions', 'church_id', [CHURCH_ID]), 10]);
  checks.push(['notificações operacionais', await count('church_management_notifications', 'church_id', [CHURCH_ID]), 5]);
  checks.push(['tipos de post', await count('posts', 'user_id', personas.map((persona) => persona.id)), 12]);

  const failures = checks.filter(([, actual, expected]) => actual < expected);
  console.table(checks.map(([name, actual, expected]) => ({ cenário: name, atual: actual, mínimo: expected, ok: actual >= expected })));
  if (failures.length) throw new Error(`A massa está incompleta em ${failures.map(([name]) => name).join(', ')}.`);

  for (const persona of personas) {
    const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const login = await client.auth.signInWithPassword({
      email: persona.email,
      password: credentials[persona.key],
    });
    assertResult(login, `Login inválido para ${persona.key}`);
    await client.auth.signOut();
  }
  console.log('ok Logins das cinco personas validados.');
}

async function writeManifest() {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify({
    fixtureKey: FIXTURE_KEY,
    churchId: CHURCH_ID,
    churchSlug: 'qa-igreja-cenario-cultoplus',
    volunteerQrPath: '/qr/qa-voluntariado-recepcao-cultoplus-v1',
    createdAt: new Date().toISOString(),
    credentials,
    users: Object.fromEntries(personas.map((persona) => [persona.key, {
      id: persona.id,
      email: persona.email,
      password: credentials[persona.key],
      expectedAccess: persona.key === 'manager'
        ? ['Minha visão', 'Gestão da Igreja']
        : persona.key === 'pastor'
          ? ['Minha visão', 'Workspace Pastoral']
          : ['Minha visão'],
    }])),
  }, null, 2)}\n`, 'utf8');
}

async function main() {
  if (MODE === '--plan') {
    console.table(personas.map(({ key, email, profileType, tier, churchMember }) => ({
      persona: key, email, perfil: profileType, plano: tier, membro: churchMember,
    })));
    console.log('Plano: 5 usuários, 1 igreja, 1 célula, 3 equipes, 9 funções, 8 cultos, 7 estados de escala, 6 formulários QR, inbox, notificações, gamificação e 11 tipos de post.');
    return;
  }
  if (MODE === '--cleanup') {
    await cleanupData({ deleteUsers: true });
    console.log('ok Massa QA removida.');
    return;
  }
  if (MODE === '--validate') {
    if (!existsSync(MANIFEST_PATH)) throw new Error('Execute npm run qa:seed antes da validação.');
    await validateFixture();
    return;
  }
  if (MODE !== '--apply') throw new Error(`Modo desconhecido: ${MODE}`);

  await cleanupData();
  await deleteAuthUsersViaDatabase();
  await ensureAuthUsers();
  await seedCore();
  await seedChurchOperations();
  await seedFormsAndInbox();
  await seedContent();
  await writeManifest();
  await validateFixture();
  console.log(`ok Massa QA criada. Credenciais locais: ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(`fail ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

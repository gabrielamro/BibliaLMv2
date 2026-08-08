import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  filterPersonalScales,
  getPersonalScaleGroup,
  groupPersonalScales,
  replacePersonalScale,
  sortPersonalScales,
} from '../services/personalScalesService.ts';
import { resolveLegacyScaleHashTarget } from '../utils/legacyScaleLinks.ts';
import { getAppModuleForRoute } from '../moduleThemes.ts';
import type { UserCultoAssignment } from '../services/churchManagementService.ts';

const REFERENCE = new Date('2026-08-07T12:00:00.000Z').getTime();

const scale = (id: string, status: string, startsAt: string | null): UserCultoAssignment => ({
  assignment: {
    id,
    churchId: 'church-1',
    teamId: null,
    title: `Escala ${id}`,
    description: '',
    assigneeUserId: 'member-1',
    leaderUserId: null,
    scopeType: 'service',
    scopeId: null,
    status,
    requiresAcceptance: true,
    startsAt,
    endsAt: null,
    publicFeedback: '',
    createdBy: null,
    sourceType: null,
    sourceId: null,
    acceptedAt: null,
    declinedAt: null,
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
  },
  service: null,
  team: null,
} as unknown as UserCultoAssignment);

const pendingLater = scale('pending-later', 'pending', '2026-08-20T18:00:00.000Z');
const pendingSooner = scale('pending-sooner', 'pending', '2026-08-10T18:00:00.000Z');
const upcomingSoon = scale('upcoming-soon', 'accepted', '2026-08-08T18:00:00.000Z');
const upcomingLater = scale('upcoming-later', 'accepted', '2026-08-30T18:00:00.000Z');
const pastRecent = scale('past-recent', 'accepted', '2026-08-01T18:00:00.000Z');
const pastOld = scale('past-old', 'accepted', '2026-06-01T18:00:00.000Z');

const everyScale = [pastOld, upcomingLater, pendingLater, pastRecent, upcomingSoon, pendingSooner];

test('ordena pendentes primeiro, próximas depois e histórico por data decrescente', () => {
  const ordered = sortPersonalScales(everyScale, REFERENCE).map((item) => item.assignment.id);

  assert.deepEqual(ordered, [
    'pending-sooner',
    'pending-later',
    'upcoming-soon',
    'upcoming-later',
    'past-recent',
    'past-old',
  ]);
});

test('classifica cada escala em pendente, próxima ou histórico', () => {
  assert.equal(getPersonalScaleGroup(pendingLater, REFERENCE), 'pending');
  assert.equal(getPersonalScaleGroup(upcomingSoon, REFERENCE), 'upcoming');
  assert.equal(getPersonalScaleGroup(pastOld, REFERENCE), 'history');

  // Uma escala que começou há poucas horas continua sendo tratada como próxima.
  const startedHoursAgo = scale('running', 'accepted', '2026-08-07T09:00:00.000Z');
  assert.equal(getPersonalScaleGroup(startedHoursAgo, REFERENCE), 'upcoming');
});

test('agrupa e filtra a lista sem perder itens', () => {
  const groups = groupPersonalScales(everyScale, REFERENCE);

  assert.equal(groups.pending.length, 2);
  assert.equal(groups.upcoming.length, 2);
  assert.equal(groups.history.length, 2);

  assert.equal(filterPersonalScales(everyScale, 'all', REFERENCE).length, everyScale.length);
  assert.deepEqual(
    filterPersonalScales(everyScale, 'history', REFERENCE).map((item) => item.assignment.id),
    ['past-recent', 'past-old'],
  );
});

test('a resposta de aceite atualiza apenas a escala respondida na lista local', () => {
  const answered = {
    ...pendingSooner,
    assignment: { ...pendingSooner.assignment, status: 'accepted' },
  } as UserCultoAssignment;

  const updated = replacePersonalScale(everyScale, answered);

  assert.equal(updated.length, everyScale.length);
  assert.equal(updated.find((item) => item.assignment.id === 'pending-sooner')?.assignment.status, 'accepted');
  assert.equal(updated.find((item) => item.assignment.id === 'pending-later')?.assignment.status, 'pending');
});

test('hashes antigos de escala continuam levando ao conteúdo equivalente', () => {
  assert.equal(resolveLegacyScaleHashTarget('#escala'), '/minhas-escalas');
  assert.equal(resolveLegacyScaleHashTarget('escalas'), '/minhas-escalas');
  assert.equal(resolveLegacyScaleHashTarget('#equipes'), '/minhas-escalas#equipes');
  assert.equal(resolveLegacyScaleHashTarget('#solicitacoes'), '/minhas-escalas#solicitacoes');
  assert.equal(resolveLegacyScaleHashTarget('#solicitações'), '/minhas-escalas#solicitacoes');
  assert.equal(resolveLegacyScaleHashTarget(''), null);
  assert.equal(resolveLegacyScaleHashTarget('#historico'), null);
});

test('a nova rota pertence ao módulo visual de cultos', () => {
  assert.equal(getAppModuleForRoute('/minhas-escalas'), 'cultos');
  assert.equal(getAppModuleForRoute('/minhas-escalas/'), 'cultos');
});

const read = (path: string) => readFileSync(resolve(path), 'utf8');

test('a rota /minhas-escalas é protegida e usa o shell oficial do Culto+', () => {
  const route = read('app/minhas-escalas/page.tsx');
  assert.match(route, /ProtectedRoute/);
  assert.match(route, /MyScalesPage/);

  const view = read('views/MyScalesPage.tsx');
  assert.match(view, /CultoPlusPageShell/);
  assert.match(view, /data-module-theme="cultos"/);
  assert.match(view, /mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8/);
  assert.match(view, /Minhas escalas/);
  assert.match(view, /Veja onde você serve, responda convites e acompanhe suas equipes/);
});

test('Layout esconde o Sidebar legado em /minhas-escalas e /meus-cultos (só CultoPlusPageShell)', () => {
  const layout = read('components/Layout.tsx');
  assert.match(layout, /location\.pathname\.startsWith\('\/meus-cultos'\)/);
  assert.match(layout, /location\.pathname\.startsWith\('\/minhas-escalas'\)/);
  assert.match(layout, /isStandaloneCultosPersonalShell/);
  assert.match(layout, /showSidebar && !isStandaloneCultoPlusShell/);

  const mobileNav = read('components/MobileBottomNav.tsx');
  assert.match(mobileNav, /location\.pathname\.startsWith\('\/minhas-escalas'\)/);
});

test('a página reúne lista, detalhes, equipes e solicitações com âncoras estáveis', () => {
  const view = read('views/MyScalesPage.tsx');

  for (const component of ['PersonalScaleList', 'PersonalScaleDetails', 'PersonalTeamsPanel', 'VolunteerRequestsPanel']) {
    assert.match(view, new RegExp(component));
  }

  assert.match(read('components/church-management/PersonalTeamsPanel.tsx'), /id="equipes"/);
  assert.match(read('components/church-management/VolunteerRequestsPanel.tsx'), /id="solicitacoes"/);
});

test('a regra de negócio das escalas continua nos serviços', () => {
  const view = read('views/MyScalesPage.tsx');
  assert.match(view, /churchManagementService\.respondToAssignment/);
  assert.match(view, /personalScalesService\.loadPersonalScales/);

  const service = read('services/personalScalesService.ts');
  for (const contract of ['listUserCultoAssignments', 'listUserTeams', 'listMemberSubmissions', 'getUserChurchMembership']) {
    assert.match(service, new RegExp(contract));
  }
});

test('os destinos conhecidos de escala apontam para a nova página', () => {
  const shell = read('components/CultoPlusPageShell.tsx');
  assert.match(shell, /"Meu painel", href: "\/meus-cultos"/);
  assert.match(shell, /"Minha escala", href: "\/minhas-escalas"/);
  assert.match(shell, /"Minhas equipes", href: "\/minhas-escalas#equipes"/);
  assert.match(shell, /"Solicitações", href: "\/minhas-escalas#solicitacoes"/);
  assert.doesNotMatch(shell, /Agenda de cultos/);
  assert.doesNotMatch(shell, /href: "\/culto"/);

  for (const path of [
    'views/NewHomePage.tsx',
    'components/social/KingdomPathRail.tsx',
    'components/church-management/ChurchQrPublicFormPreview.tsx',
    'services/churchManagementService.ts',
    'next.config.ts',
    'scripts/seed_full_qa_fixture.mjs',
    'app/minha-igreja/designacoes/page.tsx',
    'app/minha-igreja/equipes/page.tsx',
    'app/minha-igreja/acompanhamento/page.tsx',
  ]) {
    assert.doesNotMatch(read(path), /\/meus-cultos#/, path);
  }
});

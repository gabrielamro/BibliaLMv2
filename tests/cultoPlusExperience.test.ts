import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  getCurrentLiturgyMoment,
  getExperienceMoments,
  getNextLiturgyMoment,
  resolveServiceStreamStatus,
  resolveWorshipExperienceMode,
} from '../utils/cultoPlusExperience.ts';
import type { ChurchService } from '../types.ts';

const makeService = (overrides: Partial<ChurchService> = {}): ChurchService => ({
  id: 'svc_1',
  churchId: 'church_1',
  churchName: 'Igreja Teste',
  title: 'Culto de Oracao',
  theme: 'Permanecer em Cristo',
  preacherName: 'Pr. Joao',
  serviceType: 'sunday',
  startsAt: '2026-07-07T23:00:00.000Z',
  endsAt: '2026-07-08T01:00:00.000Z',
  status: 'published',
  slug: 'culto-teste',
  createdBy: 'user_1',
  createdAt: '2026-07-06T12:00:00.000Z',
  liturgyItems: [
    { id: 'opening', kind: 'opening', title: 'Abertura', startsAt: '19:00', sortOrder: 0 },
    { id: 'word', kind: 'word', title: 'Palavra', startsAt: '19:30', sortOrder: 1 },
    { id: 'closing', kind: 'closing', title: 'Encerramento', startsAt: '20:45', sortOrder: 2 },
  ],
  ...overrides,
});

test('resolves worship experience mode from service and stream state', () => {
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'published', streamStatus: 'not_configured' }), 'before');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'checkin_open', streamStatus: 'upcoming' }), 'before');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'in_progress', streamStatus: 'live' }), 'during_with_live');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'in_progress', streamStatus: 'not_configured' }), 'during_without_live');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'live', streamStatus: 'unavailable' }), 'during_without_live');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'finished', streamStatus: 'ended' }), 'after');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'archived', streamStatus: 'ended' }), 'archived');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'live', streamStatus: 'upcoming', timeMode: 'upcoming' }), 'before');
  assert.equal(resolveWorshipExperienceMode({ serviceStatus: 'published', streamStatus: 'not_configured', timeMode: 'running' }), 'during_without_live');
});

test('uses the scheduled interval as the source of truth for stream status', () => {
  assert.equal(resolveServiceStreamStatus(makeService(), new Date('2026-07-07T22:00:00.000Z')), 'not_configured');
  assert.equal(resolveServiceStreamStatus(makeService({ liveUrl: 'https://youtube.com/live' }), new Date('2026-07-07T22:00:00.000Z')), 'upcoming');
  assert.equal(resolveServiceStreamStatus(makeService({ liveUrl: 'https://youtube.com/live', status: 'in_progress' }), new Date('2026-07-07T22:00:00.000Z')), 'upcoming');
  assert.equal(resolveServiceStreamStatus(makeService({ liveUrl: 'https://youtube.com/live', status: 'finished' }), new Date('2026-07-07T23:30:00.000Z')), 'live');
  assert.equal(resolveServiceStreamStatus(makeService({ liveUrl: 'https://youtube.com/live', status: 'live' }), new Date('2026-07-08T02:00:00.000Z')), 'ended');
});

test('resolves current and next liturgy moments', () => {
  const service = makeService();
  const current = getCurrentLiturgyMoment(service, new Date('2026-07-07T23:40:00.000Z'));

  assert.equal(current?.id, 'word');
  assert.equal(getNextLiturgyMoment(service, current)?.id, 'closing');
});

test('marks experience moments as completed, current or pending', () => {
  const service = makeService();
  const current = getCurrentLiturgyMoment(service, new Date('2026-07-07T23:40:00.000Z'));
  const moments = getExperienceMoments(service, current, new Date('2026-07-07T23:40:00.000Z'));

  assert.deepEqual(
    moments.map((moment) => [moment.id, moment.momentStatus]),
    [
      ['opening', 'completed'],
      ['word', 'current'],
      ['closing', 'pending'],
    ],
  );
});

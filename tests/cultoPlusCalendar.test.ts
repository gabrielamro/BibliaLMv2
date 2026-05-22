import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getAgendaRange, getCalendarMonthRange, getServiceTemporalStatus, groupServicesByDate } from '../utils/cultoPlusCalendar.ts';
import type { ChurchService } from '../types.ts';

const makeService = (id: string, startsAt: string, endsAt = startsAt): ChurchService => ({
  id,
  churchId: 'church_1',
  churchName: 'Igreja Teste',
  title: `Culto ${id}`,
  theme: 'Tema',
  preacherName: 'Pastor',
  serviceType: 'sunday',
  startsAt,
  endsAt,
  status: 'published',
  slug: id,
  createdBy: 'user_1',
  createdAt: startsAt,
  liturgyItems: [],
});

test('builds a month range with complete visible weeks', () => {
  const result = getCalendarMonthRange(new Date('2026-05-20T12:00:00'));

  assert.equal(result.visibleDays.length, 42);
  assert.equal(result.visibleDays[0].getDay(), 0);
  assert.equal(result.visibleDays.at(-1)?.getDay(), 6);
});

test('builds agenda range starting at local day start', () => {
  const result = getAgendaRange(new Date('2026-05-20T15:00:00'), 14);

  assert.equal(result.visibleDays.length, 14);
  assert.equal(result.visibleDays[0].getHours(), 0);
});

test('groups services by local date and sorts by start time', () => {
  const grouped = groupServicesByDate([
    makeService('late', '2026-05-20T21:00:00.000Z'),
    makeService('early', '2026-05-20T18:00:00.000Z'),
  ]);

  assert.deepEqual(
    Object.values(grouped)[0].map((service) => service.id),
    ['early', 'late'],
  );
});

test('detects temporal status from starts and ends', () => {
  const now = new Date('2026-05-20T20:00:00.000Z');

  assert.equal(getServiceTemporalStatus(makeService('live', '2026-05-20T19:00:00.000Z', '2026-05-20T21:00:00.000Z'), now), 'live');
  assert.equal(getServiceTemporalStatus(makeService('next', '2026-05-21T19:00:00.000Z', '2026-05-21T21:00:00.000Z'), now), 'upcoming');
  assert.equal(getServiceTemporalStatus(makeService('past', '2026-05-19T19:00:00.000Z', '2026-05-19T21:00:00.000Z'), now), 'finished');
});

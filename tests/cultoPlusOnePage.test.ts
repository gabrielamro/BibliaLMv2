import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildServiceCalendarEvent, getLiveStatusLabel, getOfferingItem, getServiceCounterParts, isSafeLiveUrl } from '../utils/cultoPlusOnePage.ts';
import type { ChurchService } from '../types.ts';

const makeService = (overrides: Partial<ChurchService> = {}): ChurchService => ({
  id: 'svc_1',
  churchId: 'church_1',
  churchName: 'Igreja Teste',
  title: 'O Melhor de Deus',
  theme: 'A Excelencia de Deus',
  preacherName: 'Pastor',
  serviceType: 'sunday',
  startsAt: '2026-05-21T23:00:00.000Z',
  endsAt: '2026-05-22T01:00:00.000Z',
  status: 'published',
  slug: 'culto-teste',
  createdBy: 'user_1',
  createdAt: '2026-05-21T12:00:00.000Z',
  liturgyItems: [],
  ...overrides,
});

test('shows upcoming counter before service starts', () => {
  const result = getServiceCounterParts(makeService(), new Date('2026-05-21T21:17:25.000Z'));

  assert.equal(result.mode, 'upcoming');
  assert.equal(result.label, 'Comeca em');
  assert.equal(result.hours, '01');
  assert.equal(result.minutes, '42');
  assert.equal(result.seconds, '35');
});

test('shows running counter after service starts', () => {
  const result = getServiceCounterParts(makeService(), new Date('2026-05-21T23:12:07.000Z'));

  assert.equal(result.mode, 'running');
  assert.equal(result.label, 'Em andamento ha');
  assert.equal(result.hours, '00');
  assert.equal(result.minutes, '12');
  assert.equal(result.seconds, '07');
});

test('resolves live status from live url and current time', () => {
  assert.equal(getLiveStatusLabel(makeService({ liveUrl: 'https://youtube.com/live' }), new Date('2026-05-21T21:00:00.000Z')), 'Ao vivo em breve');
  assert.equal(getLiveStatusLabel(makeService({ liveUrl: 'https://youtube.com/live' }), new Date('2026-05-21T23:30:00.000Z')), 'Ao vivo agora');
  assert.equal(getLiveStatusLabel(makeService({ liveUrl: 'https://youtube.com/live' }), new Date('2026-05-22T02:00:00.000Z')), 'Culto encerrado');
});

test('finds offering item with pix key', () => {
  const offering = getOfferingItem([
    { id: 'word', kind: 'word', title: 'Palavra', startsAt: '20:00', sortOrder: 0 },
    { id: 'offering', kind: 'offering', title: 'Oferta', startsAt: '20:30', pixKey: 'pix@test.com', pixKeyType: 'email', sortOrder: 1 },
  ]);

  assert.equal(offering?.id, 'offering');
});

test('builds calendar event with service details', () => {
  const ics = buildServiceCalendarEvent(makeService({ keyVerseRef: 'Joao 2:10' }), 'https://app.test/culto/culto-teste');

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:O Melhor de Deus/);
  assert.match(ics, /DTSTART:20260521T230000Z/);
  assert.match(ics, /URL:https:\/\/app.test\/culto\/culto-teste/);
});

test('accepts only empty or https live urls', () => {
  assert.equal(isSafeLiveUrl(''), true);
  assert.equal(isSafeLiveUrl('https://youtube.com/live'), true);
  assert.equal(isSafeLiveUrl('http://youtube.com/live'), false);
  assert.equal(isSafeLiveUrl('javascript:alert(1)'), false);
});

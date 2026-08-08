import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  DEFAULT_SERVICE_MODALITY,
  SERVICE_MODALITY_FILTERS,
  countServicesByModalityFilter,
  filterServicesByModality,
  getServiceModality,
  getServiceModalityLabel,
  getServiceParticipationLabel,
  hasServiceStream,
  normalizeServiceModality,
  serviceMatchesModalityFilter,
} from '../utils/serviceModality.ts';
import type { ChurchService, ChurchServiceModality } from '../types.ts';

const makeService = (overrides: Partial<ChurchService> = {}): ChurchService => ({
  id: 'svc_1',
  churchId: 'church_1',
  churchName: 'Igreja Teste',
  title: 'Culto de Celebracao',
  theme: 'Tema',
  preacherName: 'Pastor',
  serviceType: 'sunday',
  startsAt: '2026-08-09T22:00:00.000Z',
  endsAt: '2026-08-10T00:00:00.000Z',
  status: 'published',
  slug: 'culto-de-celebracao',
  createdBy: 'user_1',
  createdAt: '2026-08-01T12:00:00.000Z',
  liturgyItems: [],
  ...overrides,
});

test('serviço sem modalidade declarada é presencial', () => {
  assert.equal(getServiceModality(makeService()), 'presencial');
  assert.equal(DEFAULT_SERVICE_MODALITY, 'presencial');
});

test('serviço antigo sem o campo modality continua determinístico', () => {
  const legacyService = makeService();
  delete (legacyService as Partial<ChurchService>).modality;

  assert.equal(getServiceModality(legacyService), 'presencial');
  assert.equal(getServiceModalityLabel(legacyService), 'Presencial');
});

test('serviço antigo com liveUrl é resolvido como online', () => {
  assert.equal(getServiceModality(makeService({ liveUrl: 'https://youtube.com/live/abc' })), 'online');
  assert.equal(getServiceModality(makeService({ liveUrl: '   ' })), 'presencial');
  assert.equal(hasServiceStream('https://youtube.com/live/abc'), true);
  assert.equal(hasServiceStream(''), false);
  assert.equal(hasServiceStream(undefined), false);
});

test('modalidade declarada prevalece sobre a inferência por liveUrl', () => {
  assert.equal(getServiceModality(makeService({ modality: 'presencial', liveUrl: 'https://youtube.com/live/abc' })), 'presencial');
  assert.equal(getServiceModality(makeService({ modality: 'hibrido', liveUrl: 'https://youtube.com/live/abc' })), 'hibrido');
  assert.equal(getServiceModality(makeService({ modality: 'online' })), 'online');
});

test('cada branch de getServiceModality é coberta, inclusive entrada ausente', () => {
  const branches: Array<[ChurchService | null | undefined, ChurchServiceModality]> = [
    [null, 'presencial'],
    [undefined, 'presencial'],
    [makeService(), 'presencial'],
    [makeService({ liveUrl: 'https://live.example/abc' }), 'online'],
    [makeService({ modality: 'online' }), 'online'],
    [makeService({ modality: 'hibrido' }), 'hibrido'],
  ];

  branches.forEach(([service, expected]) => {
    assert.equal(getServiceModality(service), expected);
  });
});

test('normaliza valores legados e rejeita valores inválidos', () => {
  assert.equal(normalizeServiceModality('Presencial'), 'presencial');
  assert.equal(normalizeServiceModality(' IN_PERSON '), 'presencial');
  assert.equal(normalizeServiceModality('hybrid'), 'hibrido');
  assert.equal(normalizeServiceModality('streaming'), 'online');
  assert.equal(normalizeServiceModality('presencial-online'), null);
  assert.equal(normalizeServiceModality(''), null);
  assert.equal(normalizeServiceModality(null), null);
  assert.equal(normalizeServiceModality(3), null);
});

test('filtros da agenda expõem Todos, Presenciais e Online', () => {
  assert.deepEqual(SERVICE_MODALITY_FILTERS.map((filter) => filter.value), ['all', 'presencial', 'online']);
});

test('filtro de modalidade mantém híbridos nas duas listas', () => {
  const presencial = makeService({ id: 'a' });
  const online = makeService({ id: 'b', modality: 'online' });
  const legacyOnline = makeService({ id: 'c', liveUrl: 'https://live.example/abc' });
  const hibrido = makeService({ id: 'd', modality: 'hibrido' });
  const services = [presencial, online, legacyOnline, hibrido];

  assert.deepEqual(filterServicesByModality(services, 'all').map((service) => service.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(filterServicesByModality(services, 'presencial').map((service) => service.id), ['a', 'd']);
  assert.deepEqual(filterServicesByModality(services, 'online').map((service) => service.id), ['b', 'c', 'd']);

  assert.equal(countServicesByModalityFilter(services, 'presencial'), 2);
  assert.equal(countServicesByModalityFilter(services, 'online'), 3);
  assert.equal(serviceMatchesModalityFilter(presencial, 'online'), false);
  assert.equal(serviceMatchesModalityFilter(hibrido, 'online'), true);
});

test('rótulo de participação informa local ou transmissão', () => {
  assert.equal(getServiceParticipationLabel(makeService()), 'Igreja Teste');
  assert.equal(
    getServiceParticipationLabel(makeService(), { locationLabel: 'Rua das Flores, 100' }),
    'Rua das Flores, 100',
  );
  assert.equal(getServiceParticipationLabel(makeService({ modality: 'online' })), 'Transmissão online');
  assert.equal(
    getServiceParticipationLabel(makeService({ modality: 'hibrido' }), { locationLabel: 'Templo Central' }),
    'Templo Central e transmissão online',
  );
  assert.equal(getServiceParticipationLabel(makeService({ churchName: '' })), 'Endereço da igreja');
});

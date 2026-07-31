import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  createInitialDevotionalJourney,
  normalizeDevotionalJourney,
} from '../utils/devotionalJourney.ts';

test('cria jornada diária privada sem etapas concluídas', () => {
  const journey = createInitialDevotionalJourney('daily:2026-07-21');

  assert.equal(journey.devotionalId, 'daily:2026-07-21');
  assert.deepEqual(journey.completedSteps, []);
  assert.equal(journey.reflectionDraft, '');
  assert.equal(journey.completedAt, null);
  assert.equal(journey.feedSharedAt, null);
});

test('normaliza etapas duplicadas e descarta valores inválidos', () => {
  const journey = normalizeDevotionalJourney({
    devotionalId: 'daily:2026-07-21',
    completedSteps: [4, 2, 2, 9, '3'],
    practicalAction: 'Ajudar alguém hoje',
    practicalActionCompleted: true,
    reflectionDraft: 'Anotação privada',
  }, 'daily:2026-07-21');

  assert.deepEqual(journey.completedSteps, [2, 4]);
  assert.equal(journey.practicalAction, 'Ajudar alguém hoje');
  assert.equal(journey.reflectionDraft, 'Anotação privada');
});

test('não reaproveita estado de outro devocional', () => {
  const journey = normalizeDevotionalJourney({
    devotionalId: 'daily:ontem',
    completedSteps: [1, 2, 3, 4, 5],
    reflectionDraft: 'Texto de ontem',
  }, 'daily:hoje');

  assert.equal(journey.devotionalId, 'daily:hoje');
  assert.deepEqual(journey.completedSteps, []);
  assert.equal(journey.reflectionDraft, '');
});

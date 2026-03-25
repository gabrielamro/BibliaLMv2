import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getReadingGoalProgress, INICIO_QUICK_ACCESS_GROUPS, READING_RING_LENGTH } from '../utils/inicioHome.ts';

test('calculates reading goal percentage and ring offset without inversion', () => {
  const result = getReadingGoalProgress(182, 365);

  assert.deepEqual(result, {
    percent: 50,
    strokeDashoffset: READING_RING_LENGTH / 2,
  });
});

test('caps reading goal progress at one hundred percent', () => {
  const result = getReadingGoalProgress(800, 365);

  assert.deepEqual(result, {
    percent: 100,
    strokeDashoffset: 0,
  });
});

test('keeps quick access grouped like the sidebar menu', () => {
  assert.deepEqual(
    INICIO_QUICK_ACCESS_GROUPS.map((group) => group.title),
    ['Pessoal', 'Bíblia'],
  );

  assert.deepEqual(
    INICIO_QUICK_ACCESS_GROUPS[0].items.map((item) => item.label),
    ['Meus Estudos', 'Cursos & Trilhas', 'Estúdio Criativo', 'Conselheiro IA', 'Atividades'],
  );

  assert.deepEqual(
    INICIO_QUICK_ACCESS_GROUPS[1].items.map((item) => item.label),
    ['Bíblia Sagrada', 'Pão Diário', 'Orações', 'Trilhas', 'Meta de Leitura', 'Quiz Bíblico'],
  );
});

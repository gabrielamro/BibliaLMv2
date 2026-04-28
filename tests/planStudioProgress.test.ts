import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getPlanStudioChecklist, getPlanStudioCompletion } from '../components/PlanStudio/planStudioProgress.ts';
import type { CustomPlan } from '../types.ts';

const makePlan = (overrides: Partial<CustomPlan> = {}): Partial<CustomPlan> => ({
  title: '',
  description: '',
  coverUrl: '',
  weeks: [],
  privacyType: 'public',
  hasEvaluation: false,
  ...overrides,
});

test('empty room has no required checklist items complete', () => {
  const plan = makePlan();

  const checklist = getPlanStudioChecklist(plan);

  assert.equal(getPlanStudioCompletion(plan), 0);
  assert.equal(checklist.find((item) => item.id === 'details')?.complete, false);
  assert.equal(checklist.find((item) => item.id === 'cover')?.complete, false);
  assert.equal(checklist.find((item) => item.id === 'lessons')?.complete, false);
});

test('room with title, description, cover and one lesson is ready enough to publish', () => {
  const plan = makePlan({
    title: 'Vida de Oração',
    description: 'Uma sala para formar hábitos bíblicos de oração.',
    coverUrl: 'https://example.com/cover.jpg',
    weeks: [
      {
        id: 'week-1',
        title: 'Semana 1',
        days: [
          {
            id: 'lesson-1',
            title: 'Por que oramos?',
            htmlContent: '<p>Conteúdo</p>',
          },
        ],
      },
    ],
  });

  assert.equal(getPlanStudioCompletion(plan), 100);
  assert.equal(getPlanStudioChecklist(plan).filter((item) => item.required && item.complete).length, 3);
});

test('evaluation is optional and does not block completion', () => {
  const plan = makePlan({
    title: 'Sala com Aula',
    description: 'Descrição suficiente',
    coverUrl: 'https://example.com/cover.jpg',
    hasEvaluation: false,
    weeks: [{ id: 'unit', title: 'Unidade', days: [{ id: 'day', title: 'Aula', htmlContent: '' }] }],
  });

  const evaluation = getPlanStudioChecklist(plan).find((item) => item.id === 'evaluation');

  assert.equal(evaluation?.required, false);
  assert.equal(evaluation?.complete, false);
  assert.equal(getPlanStudioCompletion(plan), 100);
});

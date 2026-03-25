import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getEditDestinationForContent } from '../utils/contentEditing.ts';

test('study items always edit in criar-conteudo with contentId', () => {
  const destination = getEditDestinationForContent({
    id: 'study-1',
    type: 'study',
    title: 'Estudo',
  });

  assert.deepEqual(destination, {
    path: '/criar-conteudo',
    state: { contentId: 'study-1' },
  });
});

test('plan items keep editing in criador-jornada', () => {
  const plan = { id: 'plan-1', type: 'plan', title: 'Plano' };

  const destination = getEditDestinationForContent(plan);

  assert.deepEqual(destination, {
    path: '/criador-jornada',
    state: { planData: plan },
  });
});

test('note items do not produce a study editor route', () => {
  const destination = getEditDestinationForContent({
    id: 'note-1',
    type: 'note',
    title: 'Nota',
  });

  assert.equal(destination, null);
});

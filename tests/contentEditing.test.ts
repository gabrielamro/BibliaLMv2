import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getEditDestinationForContent } from '../utils/contentEditing.ts';

test('study items always edit in criar-conteudo with contentId', () => {
  const study = {
    id: 'study-1',
    type: 'study',
    title: 'Estudo',
  };

  const destination = getEditDestinationForContent(study);

  assert.deepEqual(destination, {
    path: '/criar-conteudo?id=study-1',
    state: { contentId: 'study-1', studyData: study },
  });
});

test('plan items edit in criar-sala studio', () => {
  const plan = { id: 'plan-1', type: 'plan', title: 'Plano' };

  const destination = getEditDestinationForContent(plan);

  assert.deepEqual(destination, {
    path: '/criar-sala?id=plan-1',
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

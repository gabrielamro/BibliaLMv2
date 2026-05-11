import test from 'node:test';
import * as assert from 'node:assert/strict';

import { decodeMoodContent, encodeMoodContent } from '../utils/socialPostMood.ts';

test('encodes and decodes feeling mood without showing marker as post text', () => {
  const encoded = encodeMoodContent('Hoje estou grato.', 'grato');

  assert.equal(encoded, '[[mood:grato]]\nHoje estou grato.');
  assert.deepEqual(decodeMoodContent(encoded), {
    mood: 'grato',
    content: 'Hoje estou grato.',
  });
});

test('keeps persisted mood when column exists', () => {
  assert.deepEqual(decodeMoodContent('Hoje estou em paz.', 'paz'), {
    mood: 'paz',
    content: 'Hoje estou em paz.',
  });
});

import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildDevotionalPassageWindow } from '../utils/devotionalBibleContext.ts';

const chapter = {
  number: 6,
  verses: Array.from({ length: 10 }, (_, index) => ({
    number: index + 1,
    text: `Versículo ${index + 1}`,
  })),
};

test('inclui dois versículos antes e depois do versículo-base', () => {
  const passage = buildDevotionalPassageWindow(chapter, 5);

  assert.deepEqual(passage.verses.map((verse) => verse.number), [3, 4, 5, 6, 7]);
  assert.equal(passage.startVerse, 3);
  assert.equal(passage.endVerse, 7);
  assert.equal(passage.hasSurroundingVerses, true);
});

test('respeita os limites do capítulo', () => {
  const passage = buildDevotionalPassageWindow(chapter, 1);

  assert.deepEqual(passage.verses.map((verse) => verse.number), [1, 2, 3]);
  assert.equal(passage.startVerse, 1);
  assert.equal(passage.endVerse, 3);
});

test('preserva todo o intervalo quando a referência tem mais de um versículo', () => {
  const passage = buildDevotionalPassageWindow(chapter, 4, 6);

  assert.deepEqual(passage.verses.map((verse) => verse.number), [2, 3, 4, 5, 6, 7, 8]);
  assert.equal(passage.hasSurroundingVerses, true);
});

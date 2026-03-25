import test from 'node:test';
import * as assert from 'node:assert/strict';

import { extractVerseLead } from '../utils/verseTypography.ts';

test('extracts the first letter from a plain verse', () => {
  const result = extractVerseLead('Porque Deus amou o mundo');

  assert.deepEqual(result, {
    prefix: '',
    initial: 'P',
    rest: 'orque Deus amou o mundo',
  });
});

test('preserves opening punctuation before the first verse letter', () => {
  const result = extractVerseLead('"E disse Deus: Haja luz."');

  assert.deepEqual(result, {
    prefix: '"',
    initial: 'E',
    rest: ' disse Deus: Haja luz."',
  });
});

test('supports accented letters as verse initials', () => {
  const result = extractVerseLead('Àquele que é poderoso');

  assert.deepEqual(result, {
    prefix: '',
    initial: 'À',
    rest: 'quele que é poderoso',
  });
});

test('returns null when there is no visible verse content', () => {
  const result = extractVerseLead('   ');

  assert.equal(result, null);
});

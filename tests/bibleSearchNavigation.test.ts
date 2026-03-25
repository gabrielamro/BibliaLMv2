import test from 'node:test';
import * as assert from 'node:assert/strict';

import { resolveBibleSearchNavigation } from '../utils/bibleSearchNavigation.ts';

test('returns highlight metadata for a single verse reference', async () => {
  const result = await resolveBibleSearchNavigation('Joao 3:16', {
    parseReference: () => ({
      bookId: 'joao',
      bookName: 'Joao',
      chapter: 3,
      startVerse: 16,
      formatted: 'Joao 3:16',
    }),
    getTextByReference: async () => ({
      text: 'Porque Deus amou o mundo...',
      formattedRef: 'Joao 3:16',
      meta: {
        bookId: 'joao',
        chapter: 3,
        verses: [16],
      },
    }),
  });

  assert.deepEqual(result, {
    formattedRef: 'Joao 3:16',
    text: 'Porque Deus amou o mundo...',
    routeState: {
      bookId: 'joao',
      chapter: 3,
      scrollToVerse: 16,
      highlightVerses: [16],
    },
  });
});

test('returns the full highlight range for multi-verse references', async () => {
  const result = await resolveBibleSearchNavigation('Salmos 23:1-3', {
    parseReference: () => ({
      bookId: 'sl',
      bookName: 'Salmos',
      chapter: 23,
      startVerse: 1,
      endVerse: 3,
      formatted: 'Salmos 23:1-3',
    }),
    getTextByReference: async () => ({
      text: '[1] O Senhor e meu pastor. [2] ... [3] ...',
      formattedRef: 'Salmos 23:1-3',
      meta: {
        bookId: 'sl',
        chapter: 23,
        verses: [1, 2, 3],
      },
    }),
  });

  assert.deepEqual(result, {
    formattedRef: 'Salmos 23:1-3',
    text: '[1] O Senhor e meu pastor. [2] ... [3] ...',
    routeState: {
      bookId: 'sl',
      chapter: 23,
      scrollToVerse: 1,
      highlightVerses: [1, 2, 3],
    },
  });
});

test('opens chapter references without forced verse highlight', async () => {
  const result = await resolveBibleSearchNavigation('Salmos 23', {
    parseReference: () => ({
      bookId: 'sl',
      bookName: 'Salmos',
      chapter: 23,
      startVerse: 1,
      formatted: 'Salmos 23',
    }),
    getTextByReference: async () => ({
      text: '[1] O Senhor e meu pastor...',
      formattedRef: 'Salmos 23',
      meta: {
        bookId: 'sl',
        chapter: 23,
        verses: Array.from({ length: 6 }, (_, index) => index + 1),
      },
    }),
  });

  assert.deepEqual(result, {
    formattedRef: 'Salmos 23',
    text: '[1] O Senhor e meu pastor...',
    routeState: {
      bookId: 'sl',
      chapter: 23,
    },
  });
});

test('falls back to parsed data when verse text lookup is unavailable', async () => {
  const result = await resolveBibleSearchNavigation('Romanos 8:28', {
    parseReference: () => ({
      bookId: 'rm',
      bookName: 'Romanos',
      chapter: 8,
      startVerse: 28,
      formatted: 'Romanos 8:28',
    }),
    getTextByReference: async () => null,
  });

  assert.deepEqual(result, {
    formattedRef: 'Romanos 8:28',
    text: '',
    routeState: {
      bookId: 'rm',
      chapter: 8,
      scrollToVerse: 28,
      highlightVerses: [28],
    },
  });
});

test('returns null for non-biblical searches', async () => {
  const result = await resolveBibleSearchNavigation('estudo de oração', {
    parseReference: () => null,
    getTextByReference: async () => null,
  });

  assert.equal(result, null);
});

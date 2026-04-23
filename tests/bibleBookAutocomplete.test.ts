import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getBibleBookAutocomplete } from '../utils/bibleBookAutocomplete.ts';

const books = [
  { id: 'gn', name: 'Gênesis' },
  { id: 'ex', name: 'Êxodo' },
  { id: 'joao', name: 'João' },
  { id: 'jo', name: 'Jó' },
];

test('suggests Genesis when the user types Gen', () => {
  assert.deepEqual(getBibleBookAutocomplete('Gen', books), [
    { id: 'gn', name: 'Gênesis', completion: 'Gênesis' },
  ]);
});

test('keeps chapter text after completing the book name', () => {
  assert.deepEqual(getBibleBookAutocomplete('Gen 1', books), [
    { id: 'gn', name: 'Gênesis', completion: 'Gênesis 1' },
  ]);
});

test('does not suggest when the input already matches the book name', () => {
  assert.deepEqual(getBibleBookAutocomplete('Gênesis', books), []);
});

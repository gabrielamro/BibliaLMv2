import test from 'node:test';
import * as assert from 'node:assert/strict';

import { normalizeLikedBy } from '../utils/socialLikes.ts';

test('normalizes liked_by from jsonb array, json string, empty string and null', () => {
  assert.deepEqual(normalizeLikedBy(['u1', 'u2']), ['u1', 'u2']);
  assert.deepEqual(normalizeLikedBy('["u1","u2"]'), ['u1', 'u2']);
  assert.deepEqual(normalizeLikedBy(''), []);
  assert.deepEqual(normalizeLikedBy(null), []);
});

test('filters invalid liked_by values instead of throwing', () => {
  assert.deepEqual(normalizeLikedBy('[broken'), []);
  assert.deepEqual(normalizeLikedBy({ nope: true }), []);
  assert.deepEqual(normalizeLikedBy(['u1', 123, null, 'u2']), ['u1', 'u2']);
});

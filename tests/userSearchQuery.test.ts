import test from 'node:test';
import * as assert from 'node:assert/strict';

import { normalizeUserSearchQuery, shouldSearchUsers } from '../utils/userSearchQuery.ts';

test('normalizeUserSearchQuery accepts names without requiring @', () => {
  assert.equal(normalizeUserSearchQuery('maria'), 'maria');
  assert.equal(normalizeUserSearchQuery(' Maria Silva '), 'Maria Silva');
});

test('normalizeUserSearchQuery still accepts @username', () => {
  assert.equal(normalizeUserSearchQuery('@gabriel'), 'gabriel');
});

test('shouldSearchUsers starts after two typed characters', () => {
  assert.equal(shouldSearchUsers('m'), false);
  assert.equal(shouldSearchUsers('ma'), true);
  assert.equal(shouldSearchUsers('@m'), false);
  assert.equal(shouldSearchUsers('@ma'), true);
});

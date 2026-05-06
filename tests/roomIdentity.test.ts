import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  getContentIdentity,
  roomIdentity,
  studyIdentity,
} from '../utils/contentIdentity.ts';

test('room identity is purple and distinct from study identity', () => {
  assert.equal(roomIdentity.kind, 'room');
  assert.equal(roomIdentity.label, 'Sala do Reino');
  assert.match(roomIdentity.accent, /purple|violet/);
  assert.match(roomIdentity.surface, /purple|violet/);

  assert.notEqual(roomIdentity.primaryButton, studyIdentity.primaryButton);
  assert.notEqual(roomIdentity.accent, studyIdentity.accent);
});

test('getContentIdentity resolves plan-like content as room identity', () => {
  assert.equal(getContentIdentity('room'), roomIdentity);
  assert.equal(getContentIdentity('plan'), roomIdentity);
  assert.equal(getContentIdentity('sala'), roomIdentity);
  assert.equal(getContentIdentity('study'), studyIdentity);
});

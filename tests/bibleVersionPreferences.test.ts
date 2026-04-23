import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  BIBLE_VERSIONS,
  DEFAULT_BIBLE_VERSION,
  findBibleVersion,
  shouldAskToSaveBibleVersion,
} from '../utils/bibleVersionPreferences.ts';

test('uses ARA as the default Bible version', () => {
  assert.equal(DEFAULT_BIBLE_VERSION, 'ara');
  assert.equal(BIBLE_VERSIONS[0].id, 'ara');
});

test('finds a supported Bible version by id', () => {
  assert.deepEqual(findBibleVersion('nvi'), {
    id: 'nvi',
    label: 'NVI',
    desc: 'Nova Versão Int.',
  });
});

test('asks to save when active version differs from default version', () => {
  assert.equal(shouldAskToSaveBibleVersion('nvi', 'ara'), true);
  assert.equal(shouldAskToSaveBibleVersion('ara', 'ara'), false);
  assert.equal(shouldAskToSaveBibleVersion(undefined, 'ara'), false);
});

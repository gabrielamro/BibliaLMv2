import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildEditableProfileDraft } from '../utils/profileSettings.ts';

test('edit profile draft includes account privacy and appearance defaults', () => {
  const draft = buildEditableProfileDraft({
    displayName: 'Gabriel',
    bio: '',
    slogan: '',
    instagram: '',
    city: '',
    state: '',
    isProfilePublic: undefined,
    theme: undefined,
  } as any);

  assert.equal(draft.isProfilePublic, true);
  assert.equal(draft.theme, 'dark');
});

test('edit profile draft preserves account privacy and appearance values', () => {
  const draft = buildEditableProfileDraft({
    displayName: 'Gabriel',
    bio: 'Bio',
    slogan: 'Sola Scriptura',
    instagram: 'gabriel',
    city: 'Manaus',
    state: 'AM',
    isProfilePublic: false,
    theme: 'light',
  } as any);

  assert.equal(draft.isProfilePublic, false);
  assert.equal(draft.theme, 'light');
  assert.equal(draft.slogan, 'Sola Scriptura');
});

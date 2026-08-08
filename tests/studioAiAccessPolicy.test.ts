import assert from 'node:assert/strict';
import test from 'node:test';

import { canAccessStudioAi } from '../services/studioAiAccessPolicy.ts';

test('allows pastoral workspace profiles independently of a plan tier', () => {
  assert.equal(canAccessStudioAi({ subscriptionTier: 'free', profileType: 'manager' }), true);
  assert.equal(canAccessStudioAi({ subscriptionTier: 'free', profileType: 'pastor' }), true);
});

test('uses the configured feature matrix when the profile is not privileged', () => {
  const featuresMatrix = {
    bronze: { aiSermonBuilder: true },
    gold: { aiSermonBuilder: false },
  };

  assert.equal(canAccessStudioAi({ subscriptionTier: 'bronze', profileType: 'user', featuresMatrix }), true);
  assert.equal(canAccessStudioAi({ subscriptionTier: 'gold', profileType: 'user', featuresMatrix }), false);
});

test('keeps the existing default access policy when settings are unavailable', () => {
  assert.equal(canAccessStudioAi({ subscriptionTier: 'gold', profileType: 'user' }), true);
  assert.equal(canAccessStudioAi({ subscriptionTier: 'free', profileType: 'user' }), false);
});

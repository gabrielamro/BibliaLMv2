import assert from 'node:assert/strict';
import test from 'node:test';

import { canAccessAiFeature, isAiFeatureKey } from '../services/aiFeatureAccessPolicy.ts';

test('recognizes only supported AI capabilities', () => {
  assert.equal(isAiFeatureKey('aiImageGen'), true);
  assert.equal(isAiFeatureKey('arbitraryFeature'), false);
});

test('uses the configured plan matrix before defaults', () => {
  assert.equal(canAccessAiFeature({
    subscriptionTier: 'bronze',
    feature: 'aiImageGen',
    featuresMatrix: { bronze: { aiImageGen: true } },
  }), true);
  assert.equal(canAccessAiFeature({
    subscriptionTier: 'gold',
    feature: 'aiImageGen',
    featuresMatrix: { gold: { aiImageGen: false } },
  }), false);
});

test('keeps chat and limited image generation free, while pastoral builder stays pastoral', () => {
  assert.equal(canAccessAiFeature({ subscriptionTier: 'free', feature: 'aiChatAccess' }), true);
  assert.equal(canAccessAiFeature({ subscriptionTier: 'free', feature: 'aiImageGen' }), true);
  assert.equal(canAccessAiFeature({ subscriptionTier: 'bronze', feature: 'aiImageGen' }), true);
  assert.equal(canAccessAiFeature({ subscriptionTier: 'silver', feature: 'aiImageGen' }), true);
  assert.equal(canAccessAiFeature({ subscriptionTier: 'free', profileType: 'pastor', feature: 'aiSermonBuilder' }), true);
});

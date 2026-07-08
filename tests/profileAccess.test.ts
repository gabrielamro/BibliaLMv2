import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessPastoralWorkspace,
  getGeneralProfileType,
  isGeneralManager,
  isGeneralPastor,
  toManaActorRole,
} from '../utils/profileAccess.ts';

test('getGeneralProfileType defaults to user', () => {
  assert.equal(getGeneralProfileType(null), 'user');
  assert.equal(getGeneralProfileType({ subscriptionTier: 'free' }), 'user');
});

test('getGeneralProfileType keeps compatibility with legacy pastor tier', () => {
  assert.equal(getGeneralProfileType({ subscriptionTier: 'pastor' }), 'pastor');
});

test('profileType wins over commercial tier for general identity', () => {
  assert.equal(getGeneralProfileType({ profileType: 'manager', subscriptionTier: 'gold' }), 'manager');
  assert.equal(getGeneralProfileType({ profileType: 'pastor', subscriptionTier: 'free' }), 'pastor');
});

test('pastor and manager can access personal pastoral workspace', () => {
  assert.equal(canAccessPastoralWorkspace({ profileType: 'pastor', subscriptionTier: 'free' }), true);
  assert.equal(canAccessPastoralWorkspace({ profileType: 'manager', subscriptionTier: 'free' }), true);
  assert.equal(canAccessPastoralWorkspace({ profileType: 'user', subscriptionTier: 'free' }), false);
});

test('admin remains an internal override', () => {
  assert.equal(isGeneralPastor({ subscriptionTier: 'admin' }), true);
  assert.equal(isGeneralManager({ subscriptionTier: 'admin' }), true);
  assert.equal(toManaActorRole({ subscriptionTier: 'admin' }), 'admin');
});

test('mana actor role distinguishes pastor identity from manager identity', () => {
  assert.equal(toManaActorRole({ profileType: 'pastor', subscriptionTier: 'free' }), 'pastor');
  assert.equal(toManaActorRole({ profileType: 'manager', subscriptionTier: 'free' }), 'user');
});

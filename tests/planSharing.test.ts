import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildPlanSharePostContent,
  canUserAccessPlan,
  getPlanShareUrl,
  normalizePlanPrivacy,
} from '../utils/planSharing.ts';

const basePlan = {
  id: 'plan-1',
  authorId: 'owner-1',
  title: 'Vida de Oracao',
  description: 'Uma jornada pastoral sobre vida devocional.',
  privacyType: 'public' as const,
  privacyLevel: 'public' as const,
};

const churchProfile = {
  uid: 'user-1',
  churchData: {
    churchId: 'church-1',
    churchName: 'Igreja Central',
    churchSlug: 'central',
    groupId: 'group-1',
    groupName: 'Jovens',
  },
};

test('getPlanShareUrl returns the canonical jornada URL', () => {
  assert.equal(getPlanShareUrl('plan-1'), 'https://cultomais.vercel.app/jornada/plan-1');
  assert.equal(getPlanShareUrl('plan com espaco'), 'https://cultomais.vercel.app/jornada/plan%20com%20espaco');
});

test('canUserAccessPlan always allows the owner', () => {
  assert.equal(canUserAccessPlan({ ...basePlan, privacyLevel: 'invite_only' }, null, 'owner-1'), true);
});

test('canUserAccessPlan allows public plans without login', () => {
  assert.equal(canUserAccessPlan(basePlan, null, undefined), true);
});

test('canUserAccessPlan blocks invite-only plans for users outside the allowed list', () => {
  const plan = { ...basePlan, privacyType: 'followers' as const, privacyLevel: 'invite_only' as const, allowedUserIds: ['user-2'] };

  assert.equal(canUserAccessPlan(plan, churchProfile, 'user-1'), false);
  assert.equal(canUserAccessPlan(plan, churchProfile, 'user-2'), true);
});

test('canUserAccessPlan allows church and group audiences only inside the selected audience', () => {
  assert.equal(canUserAccessPlan({ ...basePlan, privacyType: 'church' as const, privacyLevel: 'church' as const, churchId: 'church-1' }, churchProfile, 'user-1'), true);
  assert.equal(canUserAccessPlan({ ...basePlan, privacyType: 'church' as const, privacyLevel: 'church' as const, churchId: 'church-2' }, churchProfile, 'user-1'), false);
  assert.equal(canUserAccessPlan({ ...basePlan, privacyType: 'group' as const, privacyLevel: 'group' as const, allowedGroupIds: ['group-1'] }, churchProfile, 'user-1'), true);
  assert.equal(canUserAccessPlan({ ...basePlan, privacyType: 'group' as const, privacyLevel: 'group' as const, allowedGroupIds: ['group-2'] }, churchProfile, 'user-1'), false);
});

test('normalizePlanPrivacy maps audience choices to persisted plan fields', () => {
  assert.deepEqual(normalizePlanPrivacy({ visibility: 'public', allowPdfDownload: true }), {
    privacyType: 'public',
    privacyLevel: 'public',
    isPublic: true,
    inviteRequired: false,
    allowPdfDownload: true,
    allowedUserIds: [],
    allowedGroupIds: [],
    groupId: undefined,
  });

  assert.deepEqual(normalizePlanPrivacy({ visibility: 'group', allowPdfDownload: false, selectedGroupIds: ['group-2', 'group-3'] }), {
    privacyType: 'group',
    privacyLevel: 'group',
    isPublic: false,
    inviteRequired: true,
    allowPdfDownload: false,
    allowedUserIds: [],
    allowedGroupIds: ['group-2'],
    groupId: 'group-2',
  });
});

test('buildPlanSharePostContent creates a feed-friendly room share payload', () => {
  const content = buildPlanSharePostContent(basePlan, 'https://biblialm.com.br/jornada/plan-1', 'Comece por esta sala.');

  assert.match(content, /Compartilhou uma sala no Reino/);
  assert.match(content, /Vida de Oracao/);
  assert.match(content, /Comece por esta sala\./);
  assert.match(content, /https:\/\/biblialm\.com\.br\/jornada\/plan-1/);
});

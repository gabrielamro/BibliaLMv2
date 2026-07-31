import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getChurchGroupCapabilities } from '../utils/churchGroupRules.ts';
import type { ChurchMemberRole } from '../types.ts';

const role = (
  overrides: Partial<ChurchMemberRole> & Pick<ChurchMemberRole, 'role'>,
): ChurchMemberRole => ({
  id: `role-${overrides.role}`,
  churchId: 'church-1',
  userId: 'user-1',
  role: overrides.role,
  scopeType: 'church',
  scopeId: null,
  status: 'active',
  grantedAt: '2026-07-31T00:00:00.000Z',
  ...overrides,
});

test('membership-like roles never unlock group creation', () => {
  const noRoles = getChurchGroupCapabilities({ churchId: 'church-1', roles: [] });
  const volunteer = getChurchGroupCapabilities({
    churchId: 'church-1',
    roles: [role({ role: 'volunteer' })],
  });
  const manager = getChurchGroupCapabilities({
    churchId: 'church-1',
    roles: [role({ role: 'church_manager' })],
  });

  assert.equal(noRoles.canCreateRootGroup, false);
  assert.equal(volunteer.canCreateRootGroup, false);
  assert.equal(manager.canCreateRootGroup, false);
});

test('pastor from the same church can create root groups and subgroups', () => {
  const capabilities = getChurchGroupCapabilities({
    churchId: 'church-1',
    groupId: 'group-1',
    roles: [role({ role: 'pastor' })],
  });

  assert.equal(capabilities.canCreateRootGroup, true);
  assert.equal(capabilities.canCreateSubgroup, true);
  assert.equal(capabilities.canModerateGroup, true);
});

test('church-scoped leader can create root groups', () => {
  const capabilities = getChurchGroupCapabilities({
    churchId: 'church-1',
    roles: [role({ role: 'leader', scopeType: 'church' })],
  });

  assert.equal(capabilities.canCreateRootGroup, true);
});

test('group-scoped leader can create only below the assigned group', () => {
  const scopedLeader = role({ role: 'leader', scopeType: 'group', scopeId: 'group-1' });
  const assignedGroup = getChurchGroupCapabilities({
    churchId: 'church-1',
    groupId: 'group-1',
    roles: [scopedLeader],
  });
  const otherGroup = getChurchGroupCapabilities({
    churchId: 'church-1',
    groupId: 'group-2',
    roles: [scopedLeader],
  });

  assert.equal(assignedGroup.canCreateRootGroup, false);
  assert.equal(assignedGroup.canCreateSubgroup, true);
  assert.equal(otherGroup.canCreateSubgroup, false);
});

test('paused, revoked and cross-church roles grant no capabilities', () => {
  for (const deniedRole of [
    role({ role: 'pastor', status: 'paused' }),
    role({ role: 'leader', status: 'revoked' }),
    role({ role: 'pastor', churchId: 'church-2' }),
  ]) {
    const capabilities = getChurchGroupCapabilities({
      churchId: 'church-1',
      groupId: 'group-1',
      roles: [deniedRole],
    });
    assert.equal(capabilities.canCreateRootGroup, false);
    assert.equal(capabilities.canCreateSubgroup, false);
    assert.equal(capabilities.canModerateGroup, false);
  }
});

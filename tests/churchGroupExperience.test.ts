import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const churchPage = readFileSync(resolve('views/public/ChurchProfilePage.tsx'), 'utf8');
const groupPage = readFileSync(resolve('views/public/CellForumPage.tsx'), 'utf8');
const canonicalRoute = readFileSync(resolve('app/grupo/[cellSlug]/page.tsx'), 'utf8');
const migration = readFileSync(resolve('supabase/migrations/20260731202838_secure_church_group_capabilities.sql'), 'utf8');

test('church follow uses the dedicated church relationship', () => {
  assert.match(churchPage, /dbService\.isFollowingChurch\(currentUserId, data\.id\)/);
  assert.doesNotMatch(churchPage, /dbService\.checkIsFollowing\(currentUser\.uid, data\.id\)/);
  assert.match(churchPage, /Seguir página/);
  assert.match(churchPage, /isMember \? 'Membro' : 'Sou membro'/);
});

test('group and subgroup creation consume the shared capability and service', () => {
  assert.match(churchPage, /rootGroupCapabilities\.canCreateRootGroup/);
  assert.match(churchPage, /churchGroupService\.createGroup/);
  assert.match(groupPage, /groupCapabilities\.canCreateSubgroup/);
  assert.match(groupPage, /groupCapabilities\.canModerateGroup/);
  assert.match(groupPage, /churchGroupService\.createGroup/);
  assert.doesNotMatch(groupPage, /\(isCreator \|\| isMyGroup\)/);
});

test('canonical group route delegates access to group privacy instead of forcing login', () => {
  assert.doesNotMatch(canonicalRoute, /ProtectedRoute/);
  assert.match(canonicalRoute, /<CellForumPage \/>/);
  assert.match(groupPage, /\/grupo\/\$\{sub\.slug \|\| sub\.id\}/);
});

test('migration enforces role, scope and privacy in RLS', () => {
  assert.match(migration, /can_create_church_group/);
  assert.match(migration, /role_assignment\.role = 'pastor'/);
  assert.match(migration, /role_assignment\.role = 'leader'/);
  assert.match(migration, /role_assignment\.status = 'active'/);
  assert.match(migration, /Pastors and scoped leaders create church groups/);
  assert.match(migration, /Prayer requests follow their audience/);
  assert.match(migration, /expires_at > now\(\)/);
  assert.doesNotMatch(migration, /with check \(auth\.uid\(\) is not null and auth\.uid\(\) = created_by\)/);
});

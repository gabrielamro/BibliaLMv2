import assert from 'node:assert/strict';
import test from 'node:test';
import { churchManagementService } from '../services/churchManagementService.ts';

test('churchManagementService.getSettings falls back to default settings when schema is missing', async () => {
  const settings = await churchManagementService.getSettings('some-church-id');
  assert.equal(settings.churchId, 'some-church-id');
  assert.equal(settings.qrDefaultValidityDays, 30);
  assert.equal(settings.notifyPastorsOnSensitiveRequests, true);
});

test('churchManagementService.getSummary returns zero counters when schema is missing', async () => {
  const summary = await churchManagementService.getSummary('some-church-id');
  assert.equal(summary.openSubmissions, 0);
  assert.equal(summary.pendingAssignments, 0);
  assert.equal(summary.activeTeams, 0);
  assert.equal(summary.activeQrForms, 0);
  assert.equal(summary.unreadNotifications, 0);
  assert.equal(summary.badgesAwarded, 0);
});

test('churchManagementService.listRoles returns empty list when schema is missing', async () => {
  const roles = await churchManagementService.listRoles('some-church-id');
  assert.deepEqual(roles, []);
});

test('churchManagementService.listTeams returns empty list when schema is missing', async () => {
  const teams = await churchManagementService.listTeams('some-church-id');
  assert.deepEqual(teams, []);
});

test('churchManagementService.listAssignments returns empty list when schema is missing', async () => {
  const assignments = await churchManagementService.listAssignments('some-church-id');
  assert.deepEqual(assignments, []);
});

test('churchManagementService.listQrForms returns empty list when schema is missing', async () => {
  const forms = await churchManagementService.listQrForms('some-church-id');
  assert.deepEqual(forms, []);
});

test('churchManagementService.listSubmissions returns empty list when schema is missing', async () => {
  const submissions = await churchManagementService.listSubmissions('some-church-id');
  assert.deepEqual(submissions, []);
});

test('churchManagementService.listNotifications returns empty list when schema is missing', async () => {
  const notifications = await churchManagementService.listNotifications('some-church-id');
  assert.deepEqual(notifications, []);
});

test('churchManagementService.listBadges returns empty list when schema is missing', async () => {
  const badges = await churchManagementService.listBadges('some-church-id');
  assert.deepEqual(badges, []);
});

test('churchManagementService.getCultoPlusStats returns stats', async () => {
  const stats = await churchManagementService.getCultoPlusStats('some-church-id');
  assert.equal(stats.checkinsCount, 0);
  assert.equal(stats.servicesCount, 0);
  assert.equal(stats.activeSchedulesCount, 0);
});

test('churchManagementService.getGroupsStats returns stats', async () => {
  const stats = await churchManagementService.getGroupsStats('some-church-id');
  assert.equal(stats.cellsCount, 0);
  assert.equal(stats.pendingInvitesCount, 0);
});

test('churchManagementService.getGroupOperationalItems returns empty list when schema is missing', async () => {
  const items = await churchManagementService.getGroupOperationalItems('some-church-id');
  assert.deepEqual(items, []);
});

test('churchManagementService.createGroupInviteFollowUp returns zero result when schema is missing', async () => {
  const result = await churchManagementService.createGroupInviteFollowUp('some-church-id');
  assert.equal(result.groupsChecked, 0);
  assert.equal(result.pendingInvites, 0);
  assert.equal(result.notificationsCreated, 0);
});

test('churchManagementService.syncCultoPlusOperationalItems returns zero result when schema is missing', async () => {
  const result = await churchManagementService.syncCultoPlusOperationalItems('some-church-id');
  assert.equal(result.servicesChecked, 0);
  assert.equal(result.assignmentsCreated, 0);
  assert.equal(result.assignmentsUpdated, 0);
  assert.equal(result.submissionsCreated, 0);
  assert.equal(result.submissionsUpdated, 0);
});

test('churchManagementService.createAnalyticsSnapshot returns generated snapshot', async () => {
  const snapshot = await churchManagementService.createAnalyticsSnapshot('some-church-id');
  assert.equal(snapshot.church_id, 'some-church-id');
  assert.ok(snapshot.period_key);
});

test('churchManagementService.getAnalyticsSnapshots returns list of snapshots', async () => {
  const snapshots = await churchManagementService.getAnalyticsSnapshots('some-church-id');
  assert.deepEqual(snapshots, []);
});

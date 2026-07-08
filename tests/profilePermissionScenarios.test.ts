import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getChurchManagementAccessDecision,
  getGeneralProfileType,
} from '../utils/profileAccess.ts';
import { canAccessChurchManagement } from '../utils/churchManagementRules.ts';
import type { ChurchMemberRole, UserProfile } from '../types.ts';

const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'Usuario',
  photoURL: null,
  username: 'usuario',
  lifetimeXp: 0,
  credits: 0,
  badges: [],
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  activityLog: [],
  stats: {
    totalChaptersRead: 0,
    daysStreak: 1,
    studiesCreated: 0,
    totalDevotionalsRead: 0,
    totalNotes: 0,
    totalShares: 0,
    totalImagesGenerated: 0,
    totalChatMessages: 0,
    totalSermonsCreated: 0,
    totalVersesMarked: 0,
    totalQuizzesCompleted: 0,
    perfectQuizzes: 0,
  },
  ...overrides,
});

const activeRole = (role: ChurchMemberRole['role'], userId = 'user-1'): ChurchMemberRole => ({
  id: `role-${role}`,
  churchId: 'church-1',
  userId,
  role,
  scopeType: 'church',
  scopeId: null,
  status: 'active',
  grantedAt: '2026-07-08T00:00:00.000Z',
});

test('usuario comum sem igreja precisa vincular igreja', () => {
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: false,
    hasAllowedRole: false,
    profile: profile({ profileType: 'user' }),
  }), 'needs_church_link');
});

test('pastor sem igreja acessa workspace pastoral, mas gestao pede vinculo', () => {
  assert.equal(getGeneralProfileType(profile({ profileType: 'pastor' })), 'pastor');
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: false,
    hasAllowedRole: false,
    profile: profile({ profileType: 'pastor' }),
  }), 'management_intent_needs_church');
});

test('gestor sem igreja ve estado de solicitacao/vinculo', () => {
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: false,
    hasAllowedRole: false,
    profile: profile({ profileType: 'manager' }),
  }), 'management_intent_needs_church');
});

test('pastor com igreja sem role operacional nao administra igreja', () => {
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: true,
    hasAllowedRole: false,
    profile: profile({ profileType: 'pastor' }),
  }), 'management_intent_waiting_authorization');
});

test('gestor aprovado acessa gestao da igreja', () => {
  const hasAllowedRole = canAccessChurchManagement({
    userId: 'user-1',
    roles: [activeRole('church_manager')],
  });
  assert.equal(hasAllowedRole, true);
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: true,
    hasAllowedRole,
    profile: profile({ profileType: 'manager' }),
  }), 'granted');
});

test('lider ativo acessa gestao conforme escopo operacional', () => {
  assert.equal(canAccessChurchManagement({ userId: 'user-1', roles: [activeRole('leader')] }), true);
});

test('voluntario ativo nao acessa gestao administrativa', () => {
  const hasAllowedRole = canAccessChurchManagement({ userId: 'user-1', roles: [activeRole('volunteer')] });
  assert.equal(hasAllowedRole, false);
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: true,
    hasAllowedRole,
    profile: profile({ profileType: 'user' }),
  }), 'operational_role_required');
});

test('admin interno continua com acesso total', () => {
  const adminProfile = profile({ subscriptionTier: 'admin' });
  assert.equal(canAccessChurchManagement({ userId: 'admin-1', roles: [], isPlatformAdmin: true }), true);
  assert.equal(getChurchManagementAccessDecision({
    isLoading: false,
    isAuthenticated: true,
    hasActiveChurch: true,
    hasAllowedRole: true,
    profile: adminProfile,
  }), 'granted');
});

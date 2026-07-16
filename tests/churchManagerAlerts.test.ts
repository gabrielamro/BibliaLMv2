import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChurchManagerAlerts, getServiceConfigurationIssues } from '../utils/churchManagerAlerts.ts';

const now = new Date('2026-07-13T12:00:00.000Z');

const service = (overrides: Record<string, unknown> = {}) => ({
  id: 'service-1', churchId: 'church-1', churchName: 'Igreja', title: 'Culto de Celebração', theme: '', preacherName: '', serviceType: 'sunday', startsAt: '2026-07-16T11:00:00.000Z', endsAt: '2026-07-16T13:00:00.000Z', status: 'draft', slug: 'culto', createdBy: 'user-1', createdAt: '2026-07-10T00:00:00.000Z', liturgyItems: [], ...overrides,
}) as any;

test('getServiceConfigurationIssues reports missing operational configuration', () => {
  assert.deepEqual(getServiceConfigurationIssues({ service: service(), schedulesCount: 0, pendingSchedulesCount: 0 }), [
    'publicação', 'tema', 'pregador', 'texto-base', 'programação', 'escala',
  ]);
});

test('buildChurchManagerAlerts includes approvals, volunteer requests and incomplete cultos inside 72 hours', () => {
  const alerts = buildChurchManagerAlerts({
    now,
    notifications: [],
    assignments: [{ id: 'assignment-1', churchId: 'church-1', title: 'Escala Louvor', description: '', scopeType: 'team', status: 'pending', requiresAcceptance: true, publicFeedback: '', sourceType: 'gestao_culto_team', createdAt: '2026-07-12T00:00:00.000Z', updatedAt: '2026-07-12T00:00:00.000Z' } as any],
    submissions: [{ id: 'submission-1', churchId: 'church-1', formType: 'volunteer', submitterName: 'Ana', payload: {}, status: 'received', publicStatus: '', priority: 'normal', isSensitive: false, publicFeedback: '', internalSummary: '', nextAction: '', createdAt: '2026-07-12T00:00:00.000Z', updatedAt: '2026-07-12T00:00:00.000Z' } as any],
    cultos: [{ service: service(), schedulesCount: 0, pendingSchedulesCount: 0 }],
  });

  assert.deepEqual(new Set(alerts.map((item) => item.kind)), new Set(['approval', 'volunteer', 'service_configuration']));
});

test('buildChurchManagerAlerts ignores configured cultos outside the three-day window and closed volunteer requests', () => {
  const alerts = buildChurchManagerAlerts({
    now,
    notifications: [], assignments: [],
    submissions: [{ id: 'submission-closed', churchId: 'church-1', formType: 'volunteer', payload: {}, status: 'closed', publicStatus: '', priority: 'normal', isSensitive: false, publicFeedback: '', internalSummary: '', nextAction: '', createdAt: '2026-07-12T00:00:00.000Z', updatedAt: '2026-07-12T00:00:00.000Z' } as any],
    cultos: [{ service: service({ startsAt: '2026-07-17T12:01:00.000Z' }), schedulesCount: 0, pendingSchedulesCount: 0 }],
  });
  assert.equal(alerts.length, 0);
});

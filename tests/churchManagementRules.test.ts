import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessChurchManagement,
  extractQrSubmitterFields,
  getInboxAssignmentUpdate,
  getInboxStatusToggleUpdate,
  getNotificationStatePatch,
  getQrSubmissionRouting,
  getVolunteerApplicantIdentity,
  getVolunteerRejectionUpdate,
  splitVolunteerLeadershipFeedback,
  VOLUNTEER_REJECTION_PUBLIC_STATUS,
} from '../utils/churchManagementRules.ts';
import type { ChurchMemberRole } from '../types.ts';

const activeLeaderRole: ChurchMemberRole = {
  id: 'role-1',
  churchId: 'church-1',
  userId: 'user-1',
  role: 'leader',
  scopeType: 'church',
  scopeId: null,
  status: 'active',
  grantedAt: '2026-06-24T00:00:00.000Z',
};

test('canAccessChurchManagement allows platform and church admins', () => {
  assert.equal(canAccessChurchManagement({ userId: null, roles: [], isPlatformAdmin: true }), true);
  assert.equal(canAccessChurchManagement({ userId: 'user-2', roles: [], isChurchAdmin: true }), true);
});

test('canAccessChurchManagement requires an active allowed role for normal users', () => {
  assert.equal(canAccessChurchManagement({ userId: 'user-1', roles: [activeLeaderRole] }), true);
  assert.equal(canAccessChurchManagement({ userId: 'user-2', roles: [activeLeaderRole] }), false);
  assert.equal(canAccessChurchManagement({ userId: 'user-1', roles: [{ ...activeLeaderRole, status: 'paused' }] }), false);
  assert.equal(canAccessChurchManagement({ userId: 'user-1', roles: [{ ...activeLeaderRole, role: 'volunteer' }] }), false);
});

test('canAccessChurchManagement keeps pastoral care separate from operational management', () => {
  assert.equal(canAccessChurchManagement({
    userId: 'user-1',
    roles: [{ ...activeLeaderRole, role: 'pastor' }],
  }), false);
  assert.equal(canAccessChurchManagement({
    userId: 'user-1',
    roles: [{ ...activeLeaderRole, role: 'church_manager' }],
  }), true);
});

test('getQrSubmissionRouting routes sensitive forms to pastors', () => {
  assert.deepEqual(getQrSubmissionRouting('prayer'), {
    isSensitive: true,
    nextAction: 'Atribuir responsavel',
    audienceRole: 'pastor',
    severity: 'urgent',
  });
  assert.deepEqual(getQrSubmissionRouting('pastor_care'), {
    isSensitive: true,
    nextAction: 'Atribuir responsavel',
    audienceRole: 'pastor',
    severity: 'urgent',
  });
});

test('getQrSubmissionRouting routes volunteer forms to leadership follow-up', () => {
  assert.deepEqual(getQrSubmissionRouting('volunteer'), {
    isSensitive: false,
    nextAction: 'Encaminhar para lideranca',
    audienceRole: 'leader',
    severity: 'action',
  });
});

test('extractQrSubmitterFields accepts Portuguese and English labels', () => {
  assert.deepEqual(extractQrSubmitterFields({ Nome: ' Ana ', Telefone: ' 9999 ' }), {
    submitterName: 'Ana',
    submitterContact: '9999',
  });
  assert.deepEqual(extractQrSubmitterFields({ name: 'John', Email: 'john@example.com' }), {
    submitterName: 'John',
    submitterContact: 'john@example.com',
  });
});

test('getVolunteerApplicantIdentity prefills the handle and keeps an alias out of the full name field', () => {
  assert.deepEqual(getVolunteerApplicantIdentity({
    displayName: 'user01',
    username: 'user01',
    email: 'user01@example.com',
  }), {
    name: '',
    handle: '@user01',
  });

  assert.deepEqual(getVolunteerApplicantIdentity({
    displayName: 'Gabriel Amaro',
    username: '@gabriel',
    email: 'gabriel@example.com',
  }), {
    name: 'Gabriel Amaro',
    handle: '@gabriel',
  });
});

test('getInboxStatusToggleUpdate alternates waiting member and closed states', () => {
  assert.deepEqual(getInboxStatusToggleUpdate('received'), {
    status: 'waiting_member',
    publicStatus: 'Aguardando sua resposta',
    nextAction: 'Aguardar retorno do membro',
  });
  assert.deepEqual(getInboxStatusToggleUpdate('waiting_member'), {
    status: 'closed',
    publicStatus: 'Encerrado pela igreja',
    nextAction: 'Sem acao pendente',
  });
});

test('getInboxAssignmentUpdate assigns received submissions and preserves existing public status when unassigned', () => {
  assert.deepEqual(getInboxAssignmentUpdate({
    currentStatus: 'received',
    assigneeDraft: ' user-9 ',
    priority: 'urgent',
    publicStatus: 'Recebido pela igreja',
  }), {
    status: 'assigned',
    assignedTo: 'user-9',
    priority: 'urgent',
    publicStatus: 'Encaminhado para responsavel',
    nextAction: 'Responsavel deve acompanhar retorno',
  });

  assert.deepEqual(getInboxAssignmentUpdate({
    currentStatus: 'in_progress',
    assigneeDraft: ' ',
    priority: 'normal',
    publicStatus: 'Em acompanhamento',
  }), {
    status: 'in_progress',
    assignedTo: null,
    priority: 'normal',
    publicStatus: 'Em acompanhamento',
    nextAction: 'Atribuir responsavel',
  });
});

test('getVolunteerRejectionUpdate closes only the current request and allows a new application', () => {
  const update = getVolunteerRejectionUpdate('Tente novamente após conversar com a liderança');

  assert.equal(update.status, 'closed');
  assert.equal(update.publicStatus, VOLUNTEER_REJECTION_PUBLIC_STATUS);
  assert.match(update.publicFeedback, /Tente novamente após conversar com a liderança\./);
  assert.match(update.publicFeedback, /pode enviar uma nova solicitação de voluntariado/i);
  assert.match(update.nextAction, /pode enviar uma nova solicitação de voluntariado/i);
});

test('getVolunteerRejectionUpdate provides a respectful default message without a reason', () => {
  const update = getVolunteerRejectionUpdate('   ');

  assert.match(update.publicFeedback, /não foi aprovada neste momento/i);
  assert.doesNotMatch(update.publicFeedback, /Retorno da liderança:/);
});

test('splitVolunteerLeadershipFeedback isolates only the leadership description for emphasis', () => {
  const update = getVolunteerRejectionUpdate('Converse com a liderança antes de tentar novamente');

  assert.deepEqual(splitVolunteerLeadershipFeedback(update.publicFeedback), {
    before: 'Após avaliação, sua solicitação de voluntariado não foi aprovada neste momento.',
    leadership: 'Converse com a liderança antes de tentar novamente.',
    after: 'Você pode enviar uma nova solicitação de voluntariado quando desejar.',
  });
});

test('getNotificationStatePatch marks read or dismissed deterministically', () => {
  const timestamp = '2026-06-24T10:00:00.000Z';
  assert.deepEqual(getNotificationStatePatch('read', timestamp), { read_at: timestamp });
  assert.deepEqual(getNotificationStatePatch('dismiss', timestamp), {
    read_at: timestamp,
    dismissed_at: timestamp,
  });
});

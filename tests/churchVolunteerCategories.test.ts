import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHURCH_VOLUNTEER_ROLE_OPTIONS,
  inferVolunteerCategory,
} from '../utils/churchVolunteerCategories.ts';

const makeSubmission = (payload: Record<string, any>, internalSummary = '') => ({
  payload,
  internalSummary,
  publicFeedback: '',
  nextAction: '',
});

test('volunteer role catalog includes all requested ministry areas', () => {
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Louvor e Arte - Instrumentista')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Midia e Tech - Operador de Projecao')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Hospitalidade - Recepcionista')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Kids - Professor Infantil')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Discipulado - Lider de Pequeno Grupo')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Acao Social - Entrega de Cestas')));
  assert.ok(CHURCH_VOLUNTEER_ROLE_OPTIONS.some((item) => item.includes('Infraestrutura - Limpeza')));
});

test('inferVolunteerCategory detects new volunteer role labels', () => {
  assert.equal(inferVolunteerCategory(makeSubmission({ 'Cargo de interesse': 'Louvor e Arte - Sonoplasta / Operador de Audio' })).key, 'worship_arts');
  assert.equal(inferVolunteerCategory(makeSubmission({ 'Cargo de interesse': 'Midia e Tech - Fotografo / Videomaker' })).key, 'media_tech');
  assert.equal(inferVolunteerCategory(makeSubmission({ 'Cargo de interesse': 'Kids - Equipe de Check-in Infantil' })).key, 'kids');
});

test('inferVolunteerCategory keeps compatibility with old area labels and summaries', () => {
  assert.equal(inferVolunteerCategory(makeSubmission({ 'Area de interesse': 'Portaria' })).key, 'hospitality');
  assert.equal(inferVolunteerCategory(makeSubmission({ 'Area de interesse': 'Midia' })).key, 'media_tech');
  assert.equal(inferVolunteerCategory(makeSubmission({}, 'Pessoa demonstrou interesse em servir em estacionamento aos domingos.')).key, 'hospitality');
});

test('inferVolunteerCategory returns uncategorized when no signal exists', () => {
  assert.equal(inferVolunteerCategory(makeSubmission({ Mensagem: 'Quero ajudar onde precisar' })).key, 'uncategorized');
});

import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildDevotionalShareContent,
  parseDevotionalShareContent,
} from '../utils/devotionalSharePost.ts';
import { buildPostInsertPayloads } from '../utils/kingdomPostPayload.ts';

test('serializa e restaura o card público do Pão Diário', () => {
  const serialized = buildDevotionalShareContent({
    kind: 'devotional_share',
    devotionalId: 'daily:2026-07-21',
    devotionalTitle: 'Descanso para o coração',
    verseText: 'Lancem sobre ele toda a sua ansiedade.',
    verseReference: '1 Pedro 5:7',
    devotionalUrl: '/devocional',
    devotionalDate: '2026-07-21',
    message: '  Esta Palavra me lembrou de confiar.  ',
  });

  assert.deepEqual(parseDevotionalShareContent(serialized), {
    kind: 'devotional_share',
    devotionalId: 'daily:2026-07-21',
    devotionalTitle: 'Descanso para o coração',
    verseText: 'Lancem sobre ele toda a sua ansiedade.',
    verseReference: '1 Pedro 5:7',
    devotionalUrl: '/devocional',
    devotionalDate: '2026-07-21',
    message: 'Esta Palavra me lembrou de confiar.',
  });
});

test('não interpreta texto comum como card devocional', () => {
  assert.equal(parseDevotionalShareContent('Minha reflexão pública'), null);
});

test('rejeita payload sem referência bíblica', () => {
  assert.equal(parseDevotionalShareContent(JSON.stringify({
    kind: 'devotional_share',
    devotionalId: 'daily:1',
    devotionalTitle: 'Título',
    verseText: 'Texto',
    devotionalUrl: '/devocional',
  })), null);
});

test('preserva o card estruturado ao montar o insert do feed', () => {
  const content = buildDevotionalShareContent({
    kind: 'devotional_share',
    devotionalId: 'daily:2026-07-21',
    devotionalTitle: 'Pão da Vida',
    verseText: 'Eu sou o pão da vida.',
    verseReference: 'João 6:35',
    devotionalUrl: '/devocional',
    devotionalDate: '2026-07-21',
    message: '',
  });
  const [payload] = buildPostInsertPayloads({
    userId: 'user-1',
    type: 'devotional',
    content,
    destination: 'global',
    visibility: 'public',
  }, '2026-07-21T12:00:00.000Z');

  assert.equal(payload.type, 'devotional');
  assert.equal(payload.content, content);
  assert.equal(payload.destination, 'global');
});

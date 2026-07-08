import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildPostInsertPayloads, dropPostInsertColumn } from '../utils/kingdomPostPayload.ts';

test('builds full and legacy post insert payloads for compatible publishing', () => {
  const payloads = buildPostInsertPayloads({
    userId: '00000000-0000-0000-0000-000000000001',
    userDisplayName: 'Gabriel',
    userUsername: 'gabriel',
    userPhotoURL: 'https://example.com/avatar.png',
    content: 'Uma reflexao do Reino',
    type: 'reflection',
    destination: 'cell',
    visibility: 'group',
    churchId: '00000000-0000-0000-0000-000000000002',
    cellId: '00000000-0000-0000-0000-000000000003',
    image: 'https://example.com/post.webp',
    mood: 'grato',
    serviceId: 'service-1',
    serviceTitle: 'Culto de Celebracao',
  });

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].destination, 'cell');
  assert.equal(payloads[0].visibility, 'group');
  assert.equal(payloads[0].cell_id, '00000000-0000-0000-0000-000000000003');
  assert.deepEqual(payloads[0].liked_by, []);
  assert.equal(payloads[0].views_count, 0);
  assert.equal(payloads[0].mood, 'grato');
  assert.equal(payloads[0].service_id, 'service-1');
  assert.equal(payloads[0].service_title, 'Culto de Celebracao');

  assert.deepEqual(Object.keys(payloads[1]).sort(), [
    'church_id',
    'comments_count',
    'content',
    'created_at',
    'image_url',
    'likes_count',
    'mood',
    'type',
    'user_id',
    'views_count',
  ]);
  assert.equal('service_id' in payloads[1], false);
});

test('drops only the missing post column while preserving image_url', () => {
  const [fullPayload] = buildPostInsertPayloads({
    userId: '00000000-0000-0000-0000-000000000001',
    content: 'Arte no Reino',
    type: 'image',
    destination: 'global',
    cellId: '00000000-0000-0000-0000-000000000003',
    image: 'https://example.com/post.webp',
  });

  const withoutCell = dropPostInsertColumn(fullPayload, 'cell_id');

  assert.equal('cell_id' in withoutCell, false);
  assert.equal(withoutCell.destination, 'global');
  assert.equal(withoutCell.image_url, 'https://example.com/post.webp');
});

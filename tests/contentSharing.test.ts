import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildContentSharePostContent,
  getContentShareUrl,
  normalizeContentShareSettings,
} from '../utils/contentSharing.ts';

test('getContentShareUrl prefers published slug and falls back to preview id', () => {
  assert.equal(getContentShareUrl({ slug: 'vida-oracao', id: 'study-1' }), 'https://cultomais.vercel.app/l/vida-oracao');
  assert.equal(getContentShareUrl({ id: 'study-1' }), 'https://cultomais.vercel.app/v/study-1');
});

test('normalizeContentShareSettings persists public access and pdf inside meta', () => {
  assert.deepEqual(normalizeContentShareSettings({ visibility: 'public', allowPdfDownload: true }), {
    visibility: 'public',
    allowPdfDownload: true,
    inviteRequired: false,
    allowedUserIds: [],
    allowedGroupIds: [],
    groupId: undefined,
  });
});

test('normalizeContentShareSettings stores private audiences inside meta', () => {
  assert.deepEqual(normalizeContentShareSettings({ visibility: 'group', selectedGroupIds: ['g-1', 'g-2'] }), {
    visibility: 'group',
    allowPdfDownload: false,
    inviteRequired: true,
    allowedUserIds: [],
    allowedGroupIds: ['g-1'],
    groupId: 'g-1',
  });

  assert.deepEqual(normalizeContentShareSettings({ visibility: 'invite_only', selectedUserIds: ['u-1', 'u-2'] }), {
    visibility: 'invite_only',
    allowPdfDownload: false,
    inviteRequired: true,
    allowedUserIds: ['u-1', 'u-2'],
    allowedGroupIds: [],
    groupId: undefined,
  });
});

test('buildContentSharePostContent creates feed payload compatible with study cards', () => {
  const content = buildContentSharePostContent(
    { id: 'study-1', title: 'Vida de Oracao', coverImage: 'https://img.test/cover.png' },
    'https://cultomais.vercel.app/l/vida-oracao',
    'Leia com o grupo.',
  );

  assert.match(content, /study_share/);
  assert.match(content, /Vida de Oracao/);
  assert.match(content, /Leia com o grupo\./);
  assert.match(content, /https:\/\/cultomais\.vercel\.app\/l\/vida-oracao/);
});

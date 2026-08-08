import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildPostInsertPayloads } from '../utils/kingdomPostPayload.ts';

const publishingSource = readFileSync(new URL('../services/kingdomPublishingService.ts', import.meta.url), 'utf8');
const quizSource = readFileSync(new URL('../views/QuizPage.tsx', import.meta.url), 'utf8');
const feedSource = readFileSync(new URL('../views/social/SocialFeedPage.tsx', import.meta.url), 'utf8');
const cardSource = readFileSync(new URL('../components/social/FeedPostCard.tsx', import.meta.url), 'utf8');
const migrationSource = readFileSync(
  new URL('../supabase/migrations/20260723184447_secure_kingdom_posts.sql', import.meta.url),
  'utf8',
);
const likesMigrationSource = readFileSync(
  new URL('../supabase/migrations/20260723185905_secure_post_likes.sql', import.meta.url),
  'utf8',
);
const databaseServiceSource = readFileSync(new URL('../services/supabase.ts', import.meta.url), 'utf8');
const producerSources = [
  '../components/social/KingdomComposer.tsx',
  '../components/DevotionalFeedShareModal.tsx',
  '../views/CreateLandingPage.tsx',
  '../views/SavedStudiesPage.tsx',
  '../views/public/PublicPlanPage.tsx',
  '../app/criar-arte-sacra/page.tsx',
  '../services/cultoPlusService.ts',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('preserva origem, metadados e deduplicação no payload do post', () => {
  const [payload] = buildPostInsertPayloads({
    userId: 'user-1',
    type: 'quiz',
    content: 'Resultado do desafio',
    sourceType: 'quiz_result',
    sourceId: 'Evangelhos',
    dedupeKey: 'quiz:evangelhos:10:20:2026-07-23',
    metadata: { topic: 'Evangelhos', score: 10, xp: 20 },
  }, '2026-07-23T12:00:00.000Z');

  assert.equal(payload.source_type, 'quiz_result');
  assert.equal(payload.source_id, 'Evangelhos');
  assert.equal(payload.dedupe_key, 'quiz:evangelhos:10:20:2026-07-23');
  assert.deepEqual(payload.metadata, { topic: 'Evangelhos', score: 10, xp: 20 });
});

test('Quiz publica pelo contrato central e retorna destacando o post criado', () => {
  assert.match(quizSource, /kingdomPublishingService\.publishQuizResult/);
  assert.match(quizSource, /refreshFeed: true/);
  assert.match(quizSource, /highlightPostId: post\.id/);
  assert.doesNotMatch(quizSource, /openCreate: 'quiz'/);
  assert.match(feedSource, /data-post-id/);
  assert.match(feedSource, /scrollIntoView/);
});

test('Reino reconhece o autor autenticado enquanto o perfil ainda est\u00e1 carregando', () => {
  assert.match(feedSource, /const feedViewer = userProfile \?\? \(currentUser \? \{ uid: currentUser\.uid \}/);
  assert.match(feedSource, /dbService\.getGlobalFeed\(50, feedViewer\)/);
  assert.match(feedSource, /\[currentUser\?\.uid, userProfile\?\.uid,/);
});

test('Feed do Reino mant\u00e9m uma coluna de leitura compacta no desktop', () => {
  assert.match(feedSource, /max-w-4xl/);
  assert.doesNotMatch(feedSource, /max-w-\[1280px\]/);
});

test('contrato central exige audiência válida e retorna o post persistido', () => {
  assert.match(publishingSource, /Selecione uma igreja antes de publicar/);
  assert.match(publishingSource, /Selecione um grupo antes de publicar/);
  assert.match(publishingSource, /return dbService\.createPost/);
});

test('produtores do ecossistema usam o contrato central', () => {
  for (const source of producerSources) {
    assert.match(source, /kingdomPublishingService\.publish/);
    assert.doesNotMatch(source, /dbService\.createPost/);
  }
});

test('Feed possui cards estruturados para Quiz e check-in', () => {
  assert.match(cardSource, /post\.type === 'quiz'/);
  assert.match(cardSource, /post\.metadata\?\.score/);
  assert.match(cardSource, /post\.type === 'checkin'/);
  assert.match(cardSource, /post\.metadata\?\.place/);
});

test('migração protege audiência e propriedade no banco', () => {
  assert.match(migrationSource, /create policy posts_public_read/);
  assert.match(migrationSource, /create policy posts_authenticated_read/);
  assert.match(migrationSource, /post_visibility = 'followers'/);
  assert.match(migrationSource, /post_visibility = 'church'/);
  assert.match(migrationSource, /post_visibility = 'group'/);
  assert.match(migrationSource, /create policy posts_owner_delete/);
  assert.match(migrationSource, /idx_posts_user_dedupe_key/);
  assert.match(likesMigrationSource, /security definer/);
  assert.match(likesMigrationSource, /viewer_id uuid := \(select auth\.uid\(\)\)/);
  assert.match(likesMigrationSource, /grant execute .* to authenticated/);
  assert.match(databaseServiceSource, /supabase\.rpc\('set_post_like'/);
});

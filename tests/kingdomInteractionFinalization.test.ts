import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const migration = read('supabase/migrations/20260731213515_finalize_kingdom_interactions.sql');
const service = read('services/postInteractionService.ts');
const postView = read('views/social/PostViewPage.tsx');
const comments = read('components/social/PostCommentsSheet.tsx');
const churchAlias = read('app/social/igreja/[churchSlug]/page.tsx');
const groupAlias = read('app/social/grupo/[cellSlug]/page.tsx');
const profileAlias = read('app/social/u/[username]/page.tsx');

test('interações persistentes têm RLS e identidade derivada da sessão', () => {
  for (const table of ['post_comments', 'post_saves', 'post_hidden', 'post_reports']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(migration, /\(select auth\.uid\(\)\) = reporter_id/);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/);
});

test('aliases sociais convergem para rotas canônicas públicas', () => {
  assert.match(churchAlias, /redirect\(`\/igreja\//);
  assert.match(groupAlias, /redirect\(`\/grupo\//);
  assert.match(profileAlias, /redirect\(`\/u\//);
  assert.doesNotMatch(profileAlias, /ProtectedRoute/);
});

test('serviço centraliza curtir, salvar, ocultar e denunciar', () => {
  assert.match(service, /setLiked/);
  assert.match(service, /setPostSaved/);
  assert.match(service, /hidePost/);
  assert.match(service, /reportPost/);
});

test('página individual reutiliza o card canônico e comentários reais', () => {
  assert.match(postView, /<FeedPostCard/);
  assert.match(postView, /<PostCommentsSheet/);
  assert.match(postView, /getPost\(postId/);
  assert.match(comments, /role="dialog"/);
  assert.match(comments, /deletePostComment/);
  assert.match(comments, /event\.key === 'Escape'/);
});

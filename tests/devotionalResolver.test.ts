import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  normalizeVerseReference,
  pickSeenVerseReferencesFromDevotionals,
  pickResolvedDevotional,
  type ResolvedDevotionalCandidate,
} from '../services/devotionalResolverCore.ts';

const officialToday: ResolvedDevotionalCandidate = {
  id: 'daily:2026-03-24',
  date: '2026-03-24',
  title: 'Hoje',
  verseReference: 'João 3:16',
  verseText: 'Porque Deus amou o mundo...',
  content: '...',
  prayer: '...',
};

const fallbackCandidate: ResolvedDevotionalCandidate = {
  id: 'daily:2026-03-20',
  date: '2026-03-20',
  title: 'Fallback',
  verseReference: 'Salmos 23:1',
  verseText: 'O Senhor é o meu pastor...',
  content: '...',
  prayer: '...',
};

test('normalizeVerseReference removes case and accent differences', () => {
  assert.equal(normalizeVerseReference(' João  3:16 '), 'joao 3:16');
  assert.equal(normalizeVerseReference('JOÃO 3:16'), 'joao 3:16');
});

test('pickSeenVerseReferencesFromDevotionals reads Supabase snake_case verse fields', () => {
  const references = pickSeenVerseReferencesFromDevotionals([
    { verse_reference: 'Joao 3:16' },
    { verseReference: 'Salmos 23:1' },
    { reference: 'Romanos 8:1' },
    { verse_reference: '' },
  ]);

  assert.deepEqual(references, ['Joao 3:16', 'Salmos 23:1', 'Romanos 8:1']);
});

test('toDevotionalErrorMessage never returns [object Object] for object payloads', async () => {
  const { toDevotionalErrorMessage } = await import('../services/devotionalErrorMessage.ts');

  assert.equal(
    toDevotionalErrorMessage({ message: 'Falha autenticada' }),
    'Falha autenticada',
  );
  assert.equal(
    toDevotionalErrorMessage({ error: { message: 'nested boom' } }),
    'nested boom',
  );
  assert.equal(
    toDevotionalErrorMessage({}),
    'Não foi possível carregar o Pão Diário.',
  );
  assert.equal(
    toDevotionalErrorMessage({ code: 'X' }),
    '{"code":"X"}',
  );
  assert.notEqual(toDevotionalErrorMessage({ foo: 'bar' }), '[object Object]');
});

test('resolver converts object API errors into readable DailyDevotionalError messages', () => {
  const source = readFileSync(new URL('../services/devotionalResolver.ts', import.meta.url), 'utf8');

  assert.match(source, /toDevotionalErrorMessage/);
  assert.match(source, /asDailyDevotionalError/);
  assert.match(source, /toDevotionalErrorMessage\(payload\?\.error/);
  assert.match(source, /if \(forceNew\) throw normalized/);
  assert.doesNotMatch(source, /payload\?\.error \|\| 'Não foi possível carregar o Pão Diário\.'/);
});

test('production resolver preserves read-only content when the normal API is unavailable', () => {
  const source = readFileSync(new URL('../services/devotionalResolver.ts', import.meta.url), 'utf8');

  assert.match(source, /if \(forceNew\) throw normalized/);
  assert.match(source, /return loadReadOnlyFallback\(\)/);
  assert.doesNotMatch(source, /forceNew \|\| userId/);
});

test('daily route serves canonical content when authenticated personalization fails', () => {
  const source = readFileSync(new URL('../app/api/devotional/daily/route.ts', import.meta.url), 'utf8');

  assert.match(source, /Daily devotional personalization failed; serving canonical content/);
  assert.match(source, /return json\(toResponse\(canonical, date\)\)/);
  assert.match(source, /code: 'DAILY_DEVOTIONAL_UNAVAILABLE'/);
});

test('pickResolvedDevotional returns the official devotional when user has not seen its verse in 6 months', () => {
  const resolved = pickResolvedDevotional({
    official: officialToday,
    persistedForToday: null,
    fallbackPool: [fallbackCandidate],
    seenVerseReferences: ['salmos 23:1'],
  });

  assert.equal(resolved.id, officialToday.id);
});

test('pickResolvedDevotional returns persisted devotional for the day before recalculating', () => {
  const persisted: ResolvedDevotionalCandidate = {
    ...fallbackCandidate,
    id: 'daily:2026-03-24:alt:salmos-23-1',
    date: '2026-03-24',
  };

  const resolved = pickResolvedDevotional({
    official: officialToday,
    persistedForToday: persisted,
    fallbackPool: [fallbackCandidate],
    seenVerseReferences: ['joao 3:16'],
  });

  assert.equal(resolved.id, persisted.id);
});

test('pickResolvedDevotional returns first eligible fallback when official verse was already seen', () => {
  const resolved = pickResolvedDevotional({
    official: officialToday,
    persistedForToday: null,
    fallbackPool: [
      { ...fallbackCandidate, verseReference: 'João 3:16' },
      fallbackCandidate,
    ],
    seenVerseReferences: ['joao 3:16'],
  });

  assert.equal(resolved.id, fallbackCandidate.id);
  assert.equal(resolved.verseReference, fallbackCandidate.verseReference);
});

test('pickResolvedDevotional returns null when every candidate repeats a seen verse', () => {
  const resolved = pickResolvedDevotional({
    official: officialToday,
    persistedForToday: null,
    fallbackPool: [
      { ...fallbackCandidate, verseReference: 'João 3:16' },
      { ...fallbackCandidate, id: 'daily:2026-03-19', verseReference: 'Salmos 23:1' },
    ],
    seenVerseReferences: ['joao 3:16', 'salmos 23:1'],
  });

  assert.equal(resolved, null);
});

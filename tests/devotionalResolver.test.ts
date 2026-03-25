import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  normalizeVerseReference,
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

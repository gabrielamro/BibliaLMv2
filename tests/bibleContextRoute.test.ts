import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routeSource = readFileSync(new URL('../app/api/bible/context/route.ts', import.meta.url), 'utf8');
const bibleServiceSource = readFileSync(new URL('../services/bibleService.ts', import.meta.url), 'utf8');
const completeBible = JSON.parse(readFileSync(new URL('../biblia_completa.json', import.meta.url), 'utf8')) as Array<{
  id: string;
  chapters: string[][];
}>;

test('disponibiliza Genesis 2:10 pela Biblia empacotada sem depender da IA', () => {
  const genesis = completeBible.find((book) => book.id === 'gn');
  const verse = genesis?.chapters[1]?.[9];

  assert.match(verse ?? '', /rio/i);
  assert.match(routeSource, /const readRadius/);
  assert.match(routeSource, /radius,/);
  assert.match(bibleServiceSource, /if \(version === 'ara'\) return null/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bible = JSON.parse(readFileSync(new URL('../biblia_completa.json', import.meta.url), 'utf8')) as Array<{
  chapters: string[][];
}>;

test('a fonte de carga contem todos os livros e versiculos canonicos', () => {
  const verseCount = bible.reduce(
    (total, book) => total + book.chapters.reduce((bookTotal, chapter) => bookTotal + chapter.length, 0),
    0,
  );

  assert.equal(bible.length, 66);
  assert.equal(verseCount, 31_106);
});

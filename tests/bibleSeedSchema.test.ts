import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260806010000_deduplicate_bible_verses.sql', import.meta.url),
  'utf8',
);

test('a carga biblica protege a referencia natural contra duplicidades', () => {
  assert.match(migration, /delete from public\.bible_verses/i);
  assert.match(migration, /create unique index if not exists bible_verses_book_chapter_verse_key/i);
  assert.match(migration, /\(book_id, chapter, verse\)/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /Leitura publica dos versiculos biblicos/);
});

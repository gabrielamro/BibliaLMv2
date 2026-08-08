import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 500;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios para a carga.');
}

const bible = JSON.parse(readFileSync(resolve(process.cwd(), 'biblia_completa.json'), 'utf8'));
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const books = bible.map((book, index) => ({
  id: book.id,
  name: book.name,
  testament: index < 39 ? 'old' : 'new',
}));

const verses = bible.flatMap((book) => book.chapters.flatMap((chapter, chapterIndex) => (
  chapter.map((text, verseIndex) => ({
    book_id: book.id,
    chapter: chapterIndex + 1,
    verse: verseIndex + 1,
    text,
  }))
)));

const upsertInBatches = async (table, rows, onConflict) => {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} lote ${start / BATCH_SIZE + 1}: ${error.message}`);
    console.log(`${table}: ${Math.min(start + batch.length, rows.length)}/${rows.length}`);
  }
};

const { count: beforeCount, error: beforeError } = await supabase
  .from('bible_verses')
  .select('*', { count: 'exact', head: true });
if (beforeError) throw new Error(`Nao foi possivel ler bible_verses: ${beforeError.message}`);

console.log(`Iniciando carga de ${books.length} livros e ${verses.length} versiculos. Registros existentes: ${beforeCount ?? 0}.`);
await upsertInBatches('bible_books', books, 'id');
await upsertInBatches('bible_verses', verses, 'book_id,chapter,verse');

const { count: afterCount, error: afterError } = await supabase
  .from('bible_verses')
  .select('*', { count: 'exact', head: true });
if (afterError) throw new Error(`Nao foi possivel validar bible_verses: ${afterError.message}`);

if ((afterCount ?? 0) < verses.length) {
  throw new Error(`Carga incompleta: esperado ao menos ${verses.length}, encontrado ${afterCount ?? 0}.`);
}

console.log(`Carga concluida. bible_verses: ${afterCount}.`);

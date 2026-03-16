const { Client } = require('pg');
require('dotenv').config();

const fixSchemaSql = `
-- Drop and recreate with correct dimensions for Gemini (768)
drop function if exists match_verses;

alter table public.bible_verses alter column embedding type vector(768);

create or replace function match_verses (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  book_id text,
  chapter int,
  verse int,
  text text,
  similarity float
)
language sql stable
as $$
  select
    v.id,
    v.book_id,
    v.chapter,
    v.verse,
    v.text,
    1 - (v.embedding <=> query_embedding) as similarity
  from public.bible_verses v
  where 1 - (v.embedding <=> query_embedding) > match_threshold
  order by v.embedding <=> query_embedding
  limit match_count;
$$;
`;

async function applyFix() {
    const client = new Client({
        user: 'postgres',
        host: 'db.sewwhyxrvkcptchakocc.supabase.co',
        database: 'postgres',
        password: '[$3curityAmr550903]',
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL (Direct).');
        await client.query(fixSchemaSql);
        console.log('Schema fixed to 768 dimensions successfully.');
    } catch (err) {
        console.error('Error fixing schema:', err.message);
    } finally {
        await client.end();
    }
}

applyFix();

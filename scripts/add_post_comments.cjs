
const { Client } = require('pg');
require('dotenv').config();

const sql = `
-- Criar tabela de comentários de posts
create table if not exists public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  user_display_name text,
  user_photo_url text,
  content text not null,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.post_comments enable row level security;

-- Políticas de Segurança
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Comentários de posts são públicos' and tablename = 'post_comments') then
    create policy "Comentários de posts são públicos" on public.post_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Usuários comentam em posts' and tablename = 'post_comments') then
    create policy "Usuários comentam em posts" on public.post_comments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Usuários deletam próprios comentários de posts' and tablename = 'post_comments') then
    create policy "Usuários deletam próprios comentários de posts" on public.post_comments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Função RPC para incrementar contador de comentários
create or replace function increment_post_comments_count(post_id_input uuid)
returns void as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = post_id_input;
end;
$$ language plpgsql;
`;

async function addTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');
    await client.query(sql);
    console.log('Table post_comments, policies and RPC created successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

addTable();


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function runSql() {
    console.log('Trying to create post_comments via RPC...');
    const { error } = await supabase.rpc('exec_sql', {
        sql: sql
    });
    if (error) {
        console.error('RPC exec_sql failed:', error.message);
        // Tentar com o parâmetro 'query' se 'sql' falhar
        const { error: error2 } = await supabase.rpc('exec_sql', {
            query: sql
        });
        if (error2) {
            console.error('RPC exec_sql (with query param) also failed:', error2.message);
        } else {
            console.log('RPC exec_sql (with query param) succeeded!');
        }
    } else {
        console.log('RPC exec_sql succeeded!');
    }
}

runSql();

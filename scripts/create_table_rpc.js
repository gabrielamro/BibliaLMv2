
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
-- Criar tabela de comentários de planos
create table if not exists public.plan_comments (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.custom_plans(id) on delete cascade,
  day_id text not null,
  user_id uuid references public.profiles(id) not null,
  user_name text,
  user_photo text,
  content text not null,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.plan_comments enable row level security;

-- Políticas de Segurança
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Comentários são públicos' and tablename = 'plan_comments') then
    create policy "Comentários são públicos" on public.plan_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Usuários comentam em planos' and tablename = 'plan_comments') then
    create policy "Usuários comentam em planos" on public.plan_comments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Usuários editam próprios comentários' and tablename = 'plan_comments') then
    create policy "Usuários editam próprios comentários" on public.plan_comments for all using (auth.uid() = user_id);
  end if;
end $$;
`;

async function runSql() {
    console.log('Trying to create plan_comments via RPC...');
    const { error } = await supabase.rpc('exec_sql', {
        query: sql
    });
    if (error) {
        console.error('RPC exec_sql failed:', error.message);
    } else {
        console.log('RPC exec_sql succeeded!');
    }
}

runSql();

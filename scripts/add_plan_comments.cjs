
const { Client } = require('pg');
require('dotenv').config();

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

async function addTable() {
  const client = new Client({
    user: 'postgres',
    host: 'db.sewwhyxrvkcptchakocc.supabase.com',
    database: 'postgres',
    password: '$3curityAmr550903',
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');
    await client.query(sql);
    console.log('Table plan_comments and policies created successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

addTable();

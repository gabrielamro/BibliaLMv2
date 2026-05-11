-- Completa o schema do Feed do Reino sem recriar a tabela.
-- A coluna image_url ja existe no banco atual, mas as colunas sociais abaixo
-- evitam fallback legado e mantem destino, autor e interacoes dos posts.

alter table public.posts
  add column if not exists user_display_name text,
  add column if not exists user_username text,
  add column if not exists user_photo_url text,
  add column if not exists destination text default 'global',
  add column if not exists mood text,
  add column if not exists shares_count int default 0,
  add column if not exists liked_by jsonb default '[]',
  add column if not exists church_id uuid references public.churches(id),
  add column if not exists cell_id uuid references public.cells(id);

update public.posts
set destination = 'global'
where destination is null;

notify pgrst, 'reload schema';

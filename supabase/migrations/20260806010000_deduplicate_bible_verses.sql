-- A carga historica nao tinha chave natural e permitiu duplicidade de versiculos.
-- Mantem o registro mais antigo de cada referencia antes de proteger a tabela.
delete from public.bible_verses as duplicate
using public.bible_verses as canonical
where duplicate.book_id = canonical.book_id
  and duplicate.chapter = canonical.chapter
  and duplicate.verse = canonical.verse
  and duplicate.id > canonical.id;

create unique index if not exists bible_verses_book_chapter_verse_key
  on public.bible_verses (book_id, chapter, verse);

alter table public.bible_books enable row level security;
alter table public.bible_verses enable row level security;

grant select on public.bible_books, public.bible_verses to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bible_books' and policyname = 'Leitura publica dos livros biblicos'
  ) then
    create policy "Leitura publica dos livros biblicos"
      on public.bible_books for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bible_verses' and policyname = 'Leitura publica dos versiculos biblicos'
  ) then
    create policy "Leitura publica dos versiculos biblicos"
      on public.bible_verses for select to anon, authenticated using (true);
  end if;
end
$$;

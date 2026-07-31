import { NextRequest, NextResponse } from 'next/server';
import completeBible from '../../../../biblia_completa.json';
import { buildDevotionalPassageWindow } from '../../../../utils/devotionalBibleContext';

interface BundledBibleBook {
  id: string;
  name: string;
  chapters: string[][];
}

const bibleBooks = completeBible as BundledBibleBook[];

const readPositiveInteger = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : null;
};

export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get('bookId')?.trim().toLowerCase() ?? '';
  const chapterNumber = readPositiveInteger(request.nextUrl.searchParams.get('chapter'));
  const startVerse = readPositiveInteger(request.nextUrl.searchParams.get('start'));
  const endVerse = readPositiveInteger(request.nextUrl.searchParams.get('end')) ?? startVerse;

  if (!bookId || !chapterNumber || !startVerse || !endVerse) {
    return NextResponse.json({ error: 'Referência bíblica inválida.' }, { status: 400 });
  }

  const book = bibleBooks.find((item) => item.id === bookId);
  const chapterVerses = book?.chapters[chapterNumber - 1];
  if (!book || !chapterVerses) {
    return NextResponse.json({ error: 'Capítulo não encontrado.' }, { status: 404 });
  }

  const passage = buildDevotionalPassageWindow(
    {
      number: chapterNumber,
      verses: chapterVerses.map((text, index) => ({ number: index + 1, text })),
    },
    startVerse,
    endVerse,
  );

  return NextResponse.json({
    bookId: book.id,
    bookName: book.name,
    chapter: chapterNumber,
    ...passage,
  });
}

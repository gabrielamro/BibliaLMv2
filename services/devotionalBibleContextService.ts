import { BIBLE_BOOKS_LIST } from '../constants';
import type { Verse } from '../types';
import { buildDevotionalPassageWindow } from '../utils/devotionalBibleContext';
import { bibleService } from './bibleService';

export interface DevotionalBibleContext {
  bookId: string;
  bookName: string;
  chapter: number;
  focusStartVerse: number;
  focusEndVerse: number;
  focusReference: string;
  passageReference: string;
  testamentLabel: string;
  verses: Verse[];
  hasSurroundingVerses: boolean;
}

interface BundledPassageResponse {
  verses: Verse[];
  startVerse: number;
  endVerse: number;
  hasSurroundingVerses: boolean;
}

const formatPassageReference = (
  bookName: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
) => `${bookName} ${chapter}:${startVerse}${endVerse > startVerse ? `–${endVerse}` : ''}`;

export const createDevotionalBibleContextSummary = (
  reference: string,
  fallbackVerseText = '',
): DevotionalBibleContext | null => {
  const parsed = bibleService.parseReference(reference);
  if (!parsed) return null;

  const book = BIBLE_BOOKS_LIST.find((item) => item.id === parsed.bookId);
  const focusEndVerse = parsed.endVerse ?? parsed.startVerse;
  const testamentLabel = book?.testament === 'old'
    ? 'Antigo Testamento'
    : book?.testament === 'new'
      ? 'Novo Testamento'
      : 'Deuterocanônico';

  return {
    bookId: parsed.bookId,
    bookName: parsed.bookName,
    chapter: parsed.chapter,
    focusStartVerse: parsed.startVerse,
    focusEndVerse,
    focusReference: parsed.formatted,
    passageReference: parsed.formatted,
    testamentLabel,
    verses: fallbackVerseText
      ? [{ number: parsed.startVerse, text: fallbackVerseText }]
      : [],
    hasSurroundingVerses: false,
  };
};

export const loadDevotionalBibleContext = async (
  reference: string,
  fallbackVerseText = '',
): Promise<DevotionalBibleContext | null> => {
  const summary = createDevotionalBibleContextSummary(reference, fallbackVerseText);
  if (!summary) return null;

  try {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams({
          bookId: summary.bookId,
          chapter: String(summary.chapter),
          start: String(summary.focusStartVerse),
          end: String(summary.focusEndVerse),
        });
        const response = await fetch(`/api/bible/context?${params.toString()}`);
        if (response.ok) {
          const passage = await response.json() as BundledPassageResponse;
          if (passage.verses?.length) {
            return {
              ...summary,
              passageReference: formatPassageReference(
                summary.bookName,
                summary.chapter,
                passage.startVerse,
                passage.endVerse,
              ),
              verses: passage.verses,
              hasSurroundingVerses: passage.hasSurroundingVerses,
            };
          }
        }
      } catch (error) {
        console.warn('Contexto bíblico local indisponível; tentando o cache existente:', error);
      }
    }

    const chapter = await bibleService.getChapter(summary.bookId, summary.chapter);
    if (!chapter) return summary;

    const passage = buildDevotionalPassageWindow(
      chapter,
      summary.focusStartVerse,
      summary.focusEndVerse,
    );
    if (!passage.verses.length) return summary;

    return {
      ...summary,
      passageReference: formatPassageReference(
        summary.bookName,
        summary.chapter,
        passage.startVerse,
        passage.endVerse,
      ),
      verses: passage.verses,
      hasSurroundingVerses: passage.hasSurroundingVerses,
    };
  } catch (error) {
    console.warn('Não foi possível carregar o contexto bíblico ampliado:', error);
    return summary;
  }
};

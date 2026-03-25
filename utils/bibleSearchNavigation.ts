export interface ParsedBibleReference {
  bookId: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
  formatted: string;
}

export interface BibleReferenceTextResult {
  text: string;
  formattedRef: string;
  meta?: {
    bookId: string;
    chapter: number;
    verses: number[];
  };
}

export interface BibleSearchRouteState {
  bookId: string;
  chapter: number;
  scrollToVerse?: number;
  highlightVerses?: number[];
}

export interface BibleSearchNavigationResult {
  formattedRef: string;
  text: string;
  routeState: BibleSearchRouteState;
}

export interface BibleSearchNavigationDependencies {
  parseReference: (input: string) => ParsedBibleReference | null;
  getTextByReference: (input: string) => Promise<BibleReferenceTextResult | null>;
}

const REFERENCE_REGEX = /^([1-3]?\s?[a-zà-úçãõ\s]+)\s+(\d+)(?:[:.;\s](\d+)(?:[-,\s](\d+))?)?$/i;

async function loadDefaultDependencies(): Promise<BibleSearchNavigationDependencies> {
  const { bibleService } = await import('../services/bibleService');

  return {
    parseReference: (input) => bibleService.parseReference(input),
    getTextByReference: (input) => bibleService.getTextByReference(input),
  };
}

export const hasExplicitVerseInReference = (input: string): boolean => {
  const match = input.trim().match(REFERENCE_REGEX);
  return Boolean(match?.[3]);
};

export async function resolveBibleSearchNavigation(
  input: string,
  dependencies?: BibleSearchNavigationDependencies,
): Promise<BibleSearchNavigationResult | null> {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return null;
  }

  const activeDependencies = dependencies ?? await loadDefaultDependencies();
  const parsed = activeDependencies.parseReference(trimmedInput);
  if (!parsed) {
    return null;
  }

  const hasExplicitVerse = hasExplicitVerseInReference(trimmedInput);
  const verseData = await activeDependencies.getTextByReference(trimmedInput);
  const highlightedVerses = hasExplicitVerse
    ? verseData?.meta?.verses?.length
      ? verseData.meta.verses
      : [parsed.startVerse]
    : undefined;

  return {
    formattedRef: verseData?.formattedRef ?? parsed.formatted,
    text: verseData?.text ?? '',
    routeState: {
      bookId: parsed.bookId,
      chapter: parsed.chapter,
      ...(highlightedVerses?.length
        ? {
            scrollToVerse: highlightedVerses[0],
            highlightVerses: highlightedVerses,
          }
        : {}),
    },
  };
}

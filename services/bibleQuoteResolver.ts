export type BibleQuoteCandidate = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

const CONNECTOR_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'um', 'uma',
]);

export const normalizeBibleQuote = (value: string) => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const compactBibleQuote = (value: string) => normalizeBibleQuote(value)
  .split(' ')
  .filter((word) => word && !CONNECTOR_WORDS.has(word))
  .join(' ');

export const getBibleQuoteSearchTerms = (value: string) => compactBibleQuote(value)
  .split(' ')
  .filter((word) => word.length >= 3)
  .slice(0, 3);

export const findBibleQuote = (
  query: string,
  candidates: BibleQuoteCandidate[],
): BibleQuoteCandidate | null => {
  const compactQuery = compactBibleQuote(query);
  const queryWords = compactQuery.split(' ').filter(Boolean);

  // Frases muito curtas são ambíguas; nesses casos, a IA pode responder sem receber uma referência inventada.
  if (queryWords.length < 4) return null;

  return candidates.find((candidate) => compactBibleQuote(candidate.text).includes(compactQuery)) ?? null;
};

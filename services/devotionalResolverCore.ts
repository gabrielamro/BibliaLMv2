export interface ResolvedDevotionalCandidate {
  id: string;
  contentId?: string;
  date: string;
  title: string;
  verseReference: string;
  verseText: string;
  content: string;
  prayer: string;
  source?: 'official' | 'catalog' | 'generated';
  refreshAvailable?: boolean;
  refreshUsedAt?: string | null;
  personalized?: boolean;
}

interface PickResolvedDevotionalInput {
  official: ResolvedDevotionalCandidate | null;
  persistedForToday: ResolvedDevotionalCandidate | null;
  fallbackPool: ResolvedDevotionalCandidate[];
  seenVerseReferences: string[];
}

export const normalizeVerseReference = (reference: string) =>
  reference
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const pickSeenVerseReferencesFromDevotionals = (devotionals: any[]) =>
  devotionals
    .map((item: any) => item.verseReference ?? item.verse_reference ?? item.reference ?? '')
    .filter(Boolean);

const isEligibleCandidate = (candidate: ResolvedDevotionalCandidate | null, seen: Set<string>) => {
  if (!candidate) return false;
  return !seen.has(normalizeVerseReference(candidate.verseReference));
};

export const pickResolvedDevotional = ({
  official,
  persistedForToday,
  fallbackPool,
  seenVerseReferences,
}: PickResolvedDevotionalInput): ResolvedDevotionalCandidate | null => {
  const seen = new Set(seenVerseReferences.map(normalizeVerseReference));

  if (persistedForToday) {
    return persistedForToday;
  }

  if (isEligibleCandidate(official, seen)) {
    return official;
  }

  for (const candidate of fallbackPool) {
    if (isEligibleCandidate(candidate, seen)) {
      return candidate;
    }
  }

  return null;
};

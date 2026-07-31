import type { Chapter, Verse } from '../types';

export interface DevotionalPassageWindow {
  verses: Verse[];
  startVerse: number;
  endVerse: number;
  hasSurroundingVerses: boolean;
}

export const buildDevotionalPassageWindow = (
  chapter: Chapter,
  focusStartVerse: number,
  focusEndVerse: number = focusStartVerse,
  radius = 2,
): DevotionalPassageWindow => {
  if (!chapter.verses.length) {
    return {
      verses: [],
      startVerse: focusStartVerse,
      endVerse: focusEndVerse,
      hasSurroundingVerses: false,
    };
  }

  const firstAvailableVerse = chapter.verses[0].number;
  const lastAvailableVerse = chapter.verses[chapter.verses.length - 1].number;
  const normalizedFocusStart = Math.max(firstAvailableVerse, Math.min(focusStartVerse, lastAvailableVerse));
  const normalizedFocusEnd = Math.max(
    normalizedFocusStart,
    Math.min(focusEndVerse, lastAvailableVerse),
  );
  const startVerse = Math.max(firstAvailableVerse, normalizedFocusStart - Math.max(0, radius));
  const endVerse = Math.min(lastAvailableVerse, normalizedFocusEnd + Math.max(0, radius));
  const verses = chapter.verses.filter(
    (verse) => verse.number >= startVerse && verse.number <= endVerse,
  );

  return {
    verses,
    startVerse: verses[0]?.number ?? normalizedFocusStart,
    endVerse: verses[verses.length - 1]?.number ?? normalizedFocusEnd,
    hasSurroundingVerses: verses.some(
      (verse) => verse.number < normalizedFocusStart || verse.number > normalizedFocusEnd,
    ),
  };
};

import type { MoodType } from '../types';

const MOOD_MARKER_PATTERN = /^\[\[mood:([a-zA-Z0-9_]+)\]\]\n?/;

export function encodeMoodContent(content: string, mood?: MoodType | null) {
  if (!mood) return content;
  return `[[mood:${mood}]]\n${content}`;
}

export function decodeMoodContent(content: string, persistedMood?: MoodType | null) {
  const match = content.match(MOOD_MARKER_PATTERN);
  return {
    content: content.replace(MOOD_MARKER_PATTERN, ''),
    mood: persistedMood ?? (match?.[1] as MoodType | undefined),
  };
}

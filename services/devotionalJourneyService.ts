import type { DevotionalJourneyState } from '../types';
import {
  createInitialDevotionalJourney,
  normalizeDevotionalJourney,
} from '../utils/devotionalJourney';

const JOURNEY_SETTING_PREFIX = 'devotional_journey';

export { createInitialDevotionalJourney, normalizeDevotionalJourney } from '../utils/devotionalJourney';

const getJourneyKey = (userId: string | null | undefined, devotionalId: string) =>
  `${JOURNEY_SETTING_PREFIX}:${userId || 'guest'}:${devotionalId}`;

const readLocalJourney = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalJourney = (key: string, journey: DevotionalJourneyState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(journey));
};

export const loadDevotionalJourney = async (
  userId: string | null | undefined,
  devotionalId: string,
): Promise<DevotionalJourneyState> => {
  const key = getJourneyKey(userId, devotionalId);
  return normalizeDevotionalJourney(readLocalJourney(key), devotionalId);
};

export const saveDevotionalJourney = async (
  userId: string | null | undefined,
  journey: DevotionalJourneyState,
) => {
  const normalized = normalizeDevotionalJourney({
    ...journey,
    updatedAt: new Date().toISOString(),
  }, journey.devotionalId);
  const key = getJourneyKey(userId, journey.devotionalId);
  saveLocalJourney(key, normalized);
  return normalized;
};

import type { DevotionalJourneyState, DevotionalJourneyStep } from '../types';

export const DEFAULT_DEVOTIONAL_PRACTICAL_ACTION = 'Escolher uma atitude concreta para viver esta Palavra hoje.';

const isJourneyStep = (value: unknown): value is DevotionalJourneyStep =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

export const createInitialDevotionalJourney = (
  devotionalId: string,
  practicalAction = DEFAULT_DEVOTIONAL_PRACTICAL_ACTION,
): DevotionalJourneyState => ({
  devotionalId,
  completedSteps: [],
  reflectionDraft: '',
  practicalAction,
  practicalActionCompleted: false,
  completedAt: null,
  feedSharedAt: null,
  updatedAt: new Date().toISOString(),
});

export const normalizeDevotionalJourney = (
  value: unknown,
  devotionalId: string,
): DevotionalJourneyState => {
  const fallback = createInitialDevotionalJourney(devotionalId);
  if (!value || typeof value !== 'object') return fallback;

  const raw = value as Partial<DevotionalJourneyState>;
  if (raw.devotionalId && raw.devotionalId !== devotionalId) return fallback;

  return {
    devotionalId,
    completedSteps: Array.from(new Set((raw.completedSteps ?? []).filter(isJourneyStep))).sort(),
    reflectionDraft: typeof raw.reflectionDraft === 'string' ? raw.reflectionDraft : '',
    practicalAction: typeof raw.practicalAction === 'string' && raw.practicalAction.trim()
      ? raw.practicalAction
      : fallback.practicalAction,
    practicalActionCompleted: Boolean(raw.practicalActionCompleted),
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    feedSharedAt: typeof raw.feedSharedAt === 'string' ? raw.feedSharedAt : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt,
  };
};

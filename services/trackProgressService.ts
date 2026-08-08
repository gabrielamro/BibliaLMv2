import { supabase } from './supabase';
import type { TrackStepJournalEntry, UserTrackProgress } from '../types';

const LOCAL_PROGRESS_KEY = 'cultoplus:track-progress:v1';
const LOCAL_JOURNAL_KEY = 'cultoplus:track-journal-pending:v1';

type StoredProgress = Record<string, UserTrackProgress>;
type PendingTrackNote = Omit<TrackStepJournalEntry, 'userId'>;
type StoredTrackNotes = Record<string, PendingTrackNote>;

const getTrackNoteKey = (trackId: string, stepNumber: number) => `${trackId}:${stepNumber}`;

const readLocalTrackNotes = (): StoredTrackNotes => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_JOURNAL_KEY) || '{}') as StoredTrackNotes;
  } catch {
    return {};
  }
};

const writeLocalTrackNotes = (entries: StoredTrackNotes) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_JOURNAL_KEY, JSON.stringify(entries));
  } catch {
    // Mantém a anotação no estado da tela quando o armazenamento está indisponível.
  }
};

const normalizeCompletedSteps = (steps: unknown): number[] => {
  if (!Array.isArray(steps)) return [];
  return [...new Set(steps.filter((step): step is number => Number.isInteger(step) && step > 0))].sort((a, b) => a - b);
};

const readLocalProgress = (): StoredProgress => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}') as StoredProgress;
  } catch {
    return {};
  }
};

const writeLocalProgress = (progress: StoredProgress) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // A jornada continua em memória quando o navegador bloqueia armazenamento local.
  }
};

const toProgress = (row: any): UserTrackProgress => ({
  userId: row.user_id,
  trackId: row.track_id,
  currentStepIndex: Math.max(0, Number(row.current_step_index) || 0),
  completedStepNumbers: normalizeCompletedSteps(row.completed_step_numbers),
  startedAt: row.started_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
});

export function getLocalTrackProgress(trackIds: string[]): Record<string, UserTrackProgress> {
  const stored = readLocalProgress();
  return Object.fromEntries(trackIds.filter((trackId) => stored[trackId]).map((trackId) => [trackId, stored[trackId]]));
}

export async function getUserTrackProgress(
  userId: string | null,
  trackIds: string[],
): Promise<Record<string, UserTrackProgress>> {
  const localProgress = getLocalTrackProgress(trackIds);
  if (!userId || trackIds.length === 0) return localProgress;

  const { data, error } = await supabase
    .from('user_track_progress')
    .select('*')
    .eq('user_id', userId)
    .in('track_id', trackIds);

  if (error) {
    console.warn('Não foi possível carregar o progresso remoto das trilhas:', error);
    return localProgress;
  }

  const remoteProgress = Object.fromEntries((data || []).map((row: any) => [row.track_id, toProgress(row)]));
  const localProgressForAccount = Object.fromEntries(
    Object.entries(localProgress).map(([trackId, progress]) => [trackId, { ...progress, userId }]),
  );

  Object.entries(localProgressForAccount).forEach(([trackId, progress]) => {
    if (!remoteProgress[trackId]) void saveTrackProgress(progress);
  });

  return { ...localProgressForAccount, ...remoteProgress };
}

export async function saveTrackProgress(progress: UserTrackProgress): Promise<UserTrackProgress> {
  const normalizedProgress: UserTrackProgress = {
    ...progress,
    currentStepIndex: Math.max(0, progress.currentStepIndex),
    completedStepNumbers: normalizeCompletedSteps(progress.completedStepNumbers),
    updatedAt: new Date().toISOString(),
  };

  const localProgress = readLocalProgress();
  localProgress[progress.trackId] = normalizedProgress;
  writeLocalProgress(localProgress);

  if (!progress.userId) return normalizedProgress;

  const payload = {
    user_id: progress.userId,
    track_id: progress.trackId,
    current_step_index: normalizedProgress.currentStepIndex,
    completed_step_numbers: normalizedProgress.completedStepNumbers,
    completed_at: normalizedProgress.completedAt || null,
    updated_at: normalizedProgress.updatedAt,
  };

  const { data, error } = await supabase
    .from('user_track_progress')
    .upsert(payload, { onConflict: 'user_id,track_id' })
    .select('*')
    .single();

  if (error) {
    console.warn('O progresso foi salvo neste dispositivo, mas não sincronizou com a conta:', error);
    return normalizedProgress;
  }

  return toProgress(data);
}

export async function getTrackStepJournalEntry(
  userId: string,
  trackId: string,
  stepNumber: number,
): Promise<TrackStepJournalEntry | null> {
  const { data, error } = await supabase
    .from('track_step_journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .eq('step_number', stepNumber)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    trackId: data.track_id,
    trackTitle: data.track_title,
    stepNumber: data.step_number,
    stepTitle: data.step_title,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function getPendingTrackStepJournalEntry(
  trackId: string,
  stepNumber: number,
): PendingTrackNote | null {
  return readLocalTrackNotes()[getTrackNoteKey(trackId, stepNumber)] || null;
}

export function savePendingTrackStepJournalEntry(entry: PendingTrackNote): PendingTrackNote {
  const entries = readLocalTrackNotes();
  const normalizedEntry = { ...entry, note: entry.note.trim(), updatedAt: new Date().toISOString() };
  entries[getTrackNoteKey(entry.trackId, entry.stepNumber)] = normalizedEntry;
  writeLocalTrackNotes(entries);
  return normalizedEntry;
}

export async function syncPendingTrackJournalEntries(userId: string): Promise<number> {
  const entries = readLocalTrackNotes();
  let syncedCount = 0;

  for (const [key, entry] of Object.entries(entries)) {
    const saved = await saveTrackStepJournalEntry({ ...entry, userId });
    if (saved) {
      delete entries[key];
      syncedCount += 1;
    }
  }

  writeLocalTrackNotes(entries);
  return syncedCount;
}

export async function saveTrackStepJournalEntry(
  entry: TrackStepJournalEntry,
): Promise<TrackStepJournalEntry | null> {
  const payload = {
    user_id: entry.userId,
    track_id: entry.trackId,
    track_title: entry.trackTitle,
    step_number: entry.stepNumber,
    step_title: entry.stepTitle,
    note: entry.note.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('track_step_journal_entries')
    .upsert(payload, { onConflict: 'user_id,track_id,step_number' })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Erro ao salvar a anotação da trilha no Diário:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    trackId: data.track_id,
    trackTitle: data.track_title,
    stepNumber: data.step_number,
    stepTitle: data.step_title,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface StoredStudyDraft<T> {
  schemaVersion: 2;
  savedAt: string;
  value: T;
}

interface UseStudyDraftRecoveryOptions<T> {
  storageKey: string | null;
  value: T;
  enabled: boolean;
  debounceMs?: number;
}

const readStoredDraft = <T,>(storageKey: string): StoredStudyDraft<T> | null => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredStudyDraft<T>;
    if (parsed?.schemaVersion !== 2 || !parsed.savedAt || parsed.value == null) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const useStudyDraftRecovery = <T,>({
  storageKey,
  value,
  enabled,
  debounceMs = 900,
}: UseStudyDraftRecoveryOptions<T>) => {
  const previousKeyRef = useRef<string | null>(storageKey);
  const [recoverableDraft, setRecoverableDraft] = useState<StoredStudyDraft<T> | null>(null);

  useEffect(() => {
    const previousKey = previousKeyRef.current;
    if (previousKey && previousKey !== storageKey) {
      window.localStorage.removeItem(previousKey);
      setRecoverableDraft(null);
    }
    previousKeyRef.current = storageKey;
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !enabled) return;
    setRecoverableDraft(readStoredDraft<T>(storageKey));
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!storageKey || !enabled) return;
    const timeout = window.setTimeout(() => {
      const payload: StoredStudyDraft<T> = {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        value,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    }, debounceMs);
    return () => window.clearTimeout(timeout);
  }, [debounceMs, enabled, storageKey, value]);

  const discardDraft = useCallback(() => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setRecoverableDraft(null);
  }, [storageKey]);

  const consumeDraft = useCallback(() => {
    const draft = recoverableDraft;
    setRecoverableDraft(null);
    return draft?.value ?? null;
  }, [recoverableDraft]);

  return {
    recoverableDraft,
    consumeDraft,
    discardDraft,
  };
};

'use client';

import { useEffect, useRef, useState } from 'react';

export type StudyAutosaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

interface UseStudyAutosaveOptions<T> {
  value: T;
  enabled: boolean;
  delay?: number;
  onSave: (value: T) => Promise<void>;
}

export const useStudyAutosave = <T,>({
  value,
  enabled,
  delay = 1400,
  onSave,
}: UseStudyAutosaveOptions<T>) => {
  const [status, setStatus] = useState<StudyAutosaveStatus>('idle');
  const onSaveRef = useRef(onSave);
  const serialized = JSON.stringify(value);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(async () => {
      setStatus('saving');
      try {
        await onSaveRef.current(value);
        setStatus('saved');
      } catch (error) {
        setStatus(error instanceof Error && error.name === 'StudyRevisionConflictError' ? 'conflict' : 'error');
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, enabled, serialized]);

  return status;
};

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

const serialize = (value: unknown) => JSON.stringify(value);

export const useStudyDirtyState = <T,>(initialValue: T) => {
  const baselineRef = useRef(serialize(initialValue));
  const [baselineVersion, setBaselineVersion] = useState(0);

  const markSaved = useCallback((value: T) => {
    baselineRef.current = serialize(value);
    setBaselineVersion((version) => version + 1);
  }, []);

  const isDirty = useCallback(
    (value: T) => serialize(value) !== baselineRef.current,
    [baselineVersion],
  );

  return useMemo(() => ({ isDirty, markSaved }), [isDirty, markSaved]);
};


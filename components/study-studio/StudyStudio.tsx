'use client';

import React, { useMemo } from 'react';
import CreateLandingPage, { type EmbeddedContext } from '../../views/CreateLandingPage';
import type { StudyStudioMode } from '../../types';
import {
  createRoomLessonAdapter,
  createStandaloneStudyAdapter,
} from './studioAdapters';

export interface StudyStudioProps {
  mode?: StudyStudioMode;
  embeddedContext?: EmbeddedContext;
  draftId?: string;
}

export const StudyStudio: React.FC<StudyStudioProps> = ({
  mode = 'standalone',
  embeddedContext,
  draftId,
}) => {
  const resolvedDraftId = draftId || embeddedContext?.initialContent?.id || 'new';
  const config = useMemo(
    () => mode === 'roomLesson'
      ? createRoomLessonAdapter(resolvedDraftId)
      : createStandaloneStudyAdapter(resolvedDraftId),
    [mode, resolvedDraftId],
  );

  return (
    <CreateLandingPage
      embeddedContext={embeddedContext}
      studioConfig={config}
    />
  );
};

export default StudyStudio;

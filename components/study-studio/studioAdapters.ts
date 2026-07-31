import { createStudyStudioConfig } from '../../services/studyStudio/studioCapabilities';
import type { StudyStudioConfig } from '../../types';

export const createStandaloneStudyAdapter = (draftId = 'new'): StudyStudioConfig =>
  createStudyStudioConfig('standalone', draftId);

export const createRoomLessonAdapter = (lessonId: string): StudyStudioConfig =>
  createStudyStudioConfig('roomLesson', lessonId);


import type {
  StudyStudioCapabilities,
  StudyStudioConfig,
  StudyStudioMode,
} from '../../types';

const capabilitiesByMode: Record<StudyStudioMode, StudyStudioCapabilities> = {
  standalone: {
    canConfigureAudience: true,
    canExportPdf: true,
    canPublishStandalone: true,
    canShareToKingdom: true,
    canUseAI: true,
    finalActionLabel: 'Pré-visualizar',
  },
  roomLesson: {
    canConfigureAudience: false,
    canExportPdf: false,
    canPublishStandalone: false,
    canShareToKingdom: false,
    canUseAI: true,
    finalActionLabel: 'Concluir aula',
  },
};

export const createStudyStudioConfig = (
  mode: StudyStudioMode,
  draftId = 'new',
): StudyStudioConfig => ({
  mode,
  draftId: draftId.trim() || 'new',
  capabilities: capabilitiesByMode[mode],
});


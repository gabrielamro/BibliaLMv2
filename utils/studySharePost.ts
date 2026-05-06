export interface StudyShareContent {
  kind: 'study_share' | 'room_share';
  studyId: string;
  studyTitle: string;
  studyCoverUrl?: string;
  studyUrl: string;
  description: string;
  sourceLabel?: string;
}

export const buildStudyShareContent = (content: StudyShareContent) =>
  JSON.stringify({
    kind: 'study_share',
    studyId: content.studyId,
    studyTitle: content.studyTitle,
    studyCoverUrl: content.studyCoverUrl || '',
    studyUrl: content.studyUrl,
    description: content.description,
    sourceLabel: content.sourceLabel || 'Estudo',
  });

export const parseStudyShareContent = (value: unknown): StudyShareContent | null => {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    if (!['study_share', 'room_share'].includes(parsed?.kind) || !parsed.studyId || !parsed.studyTitle || !parsed.studyUrl) {
      return null;
    }

    return {
      kind: parsed.kind,
      studyId: String(parsed.studyId),
      studyTitle: String(parsed.studyTitle),
      studyCoverUrl: parsed.studyCoverUrl ? String(parsed.studyCoverUrl) : undefined,
      studyUrl: String(parsed.studyUrl),
      description: parsed.description ? String(parsed.description) : '',
      sourceLabel: parsed.sourceLabel ? String(parsed.sourceLabel) : 'Estudo',
    };
  } catch {
    return null;
  }
};

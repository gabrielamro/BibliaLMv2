import type { CustomPlan, PlanDayContent, PlanWeek, PlanningFrequency } from '../../types';

export type StudioTab = 'overview' | 'lessons' | 'students' | 'evaluation' | 'publication';

export interface LessonDraft extends PlanDayContent {}

export interface PlanStudioCommonProps {
  plan: Partial<CustomPlan>;
}

export interface RoomDetailsPanelProps extends PlanStudioCommonProps {
  onChange: (patch: Partial<CustomPlan>) => void;
  onFrequencyChange: (frequency: PlanningFrequency) => void;
  onGenerateCover: () => void;
  onAttachCover: (file: File) => void;
  isGeneratingCover: boolean;
  isUploadingCover: boolean;
}

export interface LessonStructurePanelProps extends PlanStudioCommonProps {
  onAddUnit: () => void;
  onRenameUnit: (unitId: string, title: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onRenameLesson: (unitId: string, lessonId: string, title: string) => void;
  onDeleteLesson: (unitId: string, lessonId: string) => void;
  onOpenLesson: (unitId: string, lesson: PlanDayContent) => void;
  onReorderUnits: (weeks: PlanWeek[]) => void;
}

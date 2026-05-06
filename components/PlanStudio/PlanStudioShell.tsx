"use client";

import React from 'react';
import type { CustomPlan, PlanDayContent, PlanWeek, PlanningFrequency } from '../../types';
import type { StudioTab } from './types';
import EvaluationPanel from './EvaluationPanel';
import LessonStructurePanel from './LessonStructurePanel';
import PlanStudioHeader from './PlanStudioHeader';
import PlanStudioTabs from './PlanStudioTabs';
import PublishChecklistPanel from './PublishChecklistPanel';
import RoomDetailsPanel from './RoomDetailsPanel';

interface PlanStudioShellProps {
  plan: Partial<CustomPlan>;
  savedPlanId: string | null;
  activeTab: StudioTab;
  isSaving: boolean;
  isPublishing: boolean;
  isGeneratingCover: boolean;
  isUploadingCover: boolean;
  evaluationData: import('../../types').StudyEvaluation | null;
  onTabChange: (tab: StudioTab) => void;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onPlanChange: (patch: Partial<CustomPlan>) => void;
  onFrequencyChange: (frequency: PlanningFrequency) => void;
  onGenerateCover: () => void;
  onAttachCover: (file: File) => void;
  onAddUnit: () => void;
  onRenameUnit: (unitId: string, title: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onRenameLesson: (unitId: string, lessonId: string, title: string) => void;
  onDeleteLesson: (unitId: string, lessonId: string) => void;
  onOpenLesson: (unitId: string, lesson: PlanDayContent) => void;
  onReorderUnits: (weeks: PlanWeek[]) => void;
  onOpenEvaluation: () => void;
  onGenerateWithAI: () => void;
  onImportLessons: () => void;
}

const PlanStudioShell: React.FC<PlanStudioShellProps> = (props) => {
  const showDetails = props.activeTab === 'overview' || props.activeTab === 'publication';
  const showLessons = props.activeTab === 'overview' || props.activeTab === 'lessons';
  const showPublish = props.activeTab === 'overview' || props.activeTab === 'publication' || props.activeTab === 'students';
  const showEvaluation = props.activeTab === 'evaluation';

  return (
    <div className="min-h-[100dvh] bg-purple-50/70 text-gray-950 dark:bg-black dark:text-white">
      <PlanStudioHeader
        plan={props.plan}
        savedPlanId={props.savedPlanId}
        isSaving={props.isSaving}
        isPublishing={props.isPublishing}
        onBack={props.onBack}
        onSave={props.onSave}
        onPublish={props.onPublish}
        onPreview={props.onPreview}
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 lg:p-8">
        <PlanStudioTabs activeTab={props.activeTab} onChange={props.onTabChange} />

        {showEvaluation ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
            <EvaluationPanel
              plan={props.plan}
              savedPlanId={props.savedPlanId}
              evaluationData={props.evaluationData}
              onOpenEvaluation={props.onOpenEvaluation}
            />
            <PublishChecklistPanel
              plan={props.plan}
              onOpenEvaluation={props.onOpenEvaluation}
              onGenerateWithAI={props.onGenerateWithAI}
              onImportLessons={props.onImportLessons}
              showEvaluationAction={false}
            />
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[330px_minmax(0,1fr)_350px]">
          {showDetails && (
            <RoomDetailsPanel
              plan={props.plan}
              onChange={props.onPlanChange}
              onFrequencyChange={props.onFrequencyChange}
              onGenerateCover={props.onGenerateCover}
              onAttachCover={props.onAttachCover}
              isGeneratingCover={props.isGeneratingCover}
              isUploadingCover={props.isUploadingCover}
            />
          )}

          {showLessons && (
            <LessonStructurePanel
              plan={props.plan}
              onAddUnit={props.onAddUnit}
              onRenameUnit={props.onRenameUnit}
              onDeleteUnit={props.onDeleteUnit}
              onAddLesson={props.onAddLesson}
              onRenameLesson={props.onRenameLesson}
              onDeleteLesson={props.onDeleteLesson}
              onOpenLesson={props.onOpenLesson}
              onReorderUnits={props.onReorderUnits}
            />
          )}

          {showPublish && (
            <PublishChecklistPanel
              plan={props.plan}
              onOpenEvaluation={props.onOpenEvaluation}
              onGenerateWithAI={props.onGenerateWithAI}
              onImportLessons={props.onImportLessons}
            />
          )}
        </div>
        )}
      </main>
    </div>
  );
};

export default PlanStudioShell;

"use client";

import React from 'react';
import { BookOpen, ChevronRight, FileText, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PlanDayContent, PlanWeek } from '../../types';
import type { LessonStructurePanelProps } from './types';
import { getPlanLessonCount } from './planStudioProgress';

type LessonDragData = {
  unitId: string;
  index: number;
};

interface SortableLessonRowProps {
  unitId: string;
  lesson: PlanDayContent;
  lessonIndex: number;
  onRenameLesson: (unitId: string, lessonId: string, title: string) => void;
  onDeleteLesson: (unitId: string, lessonId: string) => void;
  onOpenLesson: (unitId: string, lesson: PlanDayContent) => void;
}

const SortableLessonRow: React.FC<SortableLessonRowProps> = ({
  unitId,
  lesson,
  lessonIndex,
  onRenameLesson,
  onDeleteLesson,
  onOpenLesson,
}) => {
  // O mesmo lesson.id pode existir em unidades diferentes. O ID composto é
  // apenas visual/interativo; callbacks continuam recebendo o ID persistido.
  const dragId = `${unitId}:${lesson.id}:${lessonIndex}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: { unitId, index: lessonIndex } satisfies LessonDragData,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={() => onOpenLesson(unitId, lesson)}
      className={`group flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3 transition-all dark:border-purple-900/40 dark:bg-[#0f0f0f] ${
        isDragging ? 'shadow-2xl ring-2 ring-purple-500/30' : 'shadow-sm'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        className="flex h-10 w-8 shrink-0 touch-none items-center justify-center text-gray-300"
        aria-label="Reordenar aula"
      >
        <GripVertical size={18} />
      </button>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-violet-300">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <input
          value={lesson.title}
          onChange={(event) => onRenameLesson(unitId, lesson.id, event.target.value)}
          onClick={(event) => {
            if (window.innerWidth < 640) {
              event.preventDefault();
              onOpenLesson(unitId, lesson);
              return;
            }
            event.stopPropagation();
          }}
          placeholder="Titulo da aula"
          className="w-full bg-transparent text-sm font-black text-gray-950 outline-none dark:text-white"
          aria-label="Titulo da aula"
        />
        <p className="truncate text-xs text-gray-500">{lesson.description || 'Sem descricao definida'}</p>
      </div>
      <button
        type="button"
        onClick={() => onOpenLesson(unitId, lesson)}
        className="hidden min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-black text-purple-700 transition-colors hover:bg-purple-100 dark:text-violet-200 sm:inline-flex"
      >
        Editar
        <ChevronRight size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDeleteLesson(unitId, lesson.id)}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Excluir aula"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

const EmptyUnitDropZone: React.FC<{ unitId: string }> = ({ unitId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${unitId}`,
    data: { unitId, index: 0 } satisfies LessonDragData,
  });

  return (
    <p
      ref={setNodeRef}
      className={`rounded-xl border border-dashed border-purple-200 py-5 text-center text-sm font-medium text-gray-400 transition-colors ${
        isOver ? 'bg-purple-100/70 text-purple-700' : ''
      }`}
    >
      Nenhuma aula nesta unidade.
    </p>
  );
};

const LessonStructurePanel: React.FC<LessonStructurePanelProps> = ({
  plan,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
  onAddLesson,
  onRenameLesson,
  onDeleteLesson,
  onOpenLesson,
  onReorderUnits,
}) => {
  const weeks = plan.weeks ?? [];
  const lessonCount = getPlanLessonCount(plan);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const source = event.active.data.current as LessonDragData | undefined;
    const destination = event.over?.data.current as LessonDragData | undefined;
    if (!source || !destination) return;

    const sourceUnitIndex = weeks.findIndex((unit) => unit.id === source.unitId);
    const destinationUnitIndex = weeks.findIndex((unit) => unit.id === destination.unitId);
    if (sourceUnitIndex < 0 || destinationUnitIndex < 0) return;
    if (source.unitId === destination.unitId && source.index === destination.index) return;

    const nextWeeks: PlanWeek[] = weeks.map((unit) => ({ ...unit, days: [...unit.days] }));
    const [movedLesson] = nextWeeks[sourceUnitIndex].days.splice(source.index, 1);
    const targetIndex =
      source.unitId === destination.unitId && source.index < destination.index
        ? destination.index - 1
        : destination.index;

    nextWeeks[destinationUnitIndex].days.splice(targetIndex, 0, movedLesson);
    onReorderUnits(nextWeeks);
  };

  return (
    <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Estrutura da sala</p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-gray-950 dark:text-white">Aulas</h2>
            <span className="text-sm font-medium text-gray-500">
              {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'} em {weeks.length} {weeks.length === 1 ? 'unidade' : 'unidades'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (weeks[0] ? onAddLesson(weeks[0].id) : onAddUnit())}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white shadow-lg shadow-purple-900/15 hover:bg-purple-800 dark:bg-violet-500"
        >
          <Plus size={18} />
          Nova aula
        </button>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/70 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <BookOpen size={36} className="mx-auto mb-3 text-purple-700 dark:text-violet-300" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Comece pela primeira unidade</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Crie uma unidade para organizar as aulas da sala.</p>
          <button
            type="button"
            onClick={onAddUnit}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800 dark:bg-violet-500"
          >
            <Plus size={16} />
            Criar unidade
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-5">
            {weeks.map((unit, unitIndex) => (
              <div key={unit.id} className="overflow-hidden rounded-2xl border border-purple-100 bg-purple-50/60 dark:border-purple-900/40 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-purple-100 p-4 dark:border-purple-900/40">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white dark:bg-violet-500">
                    {unitIndex + 1}
                  </div>
                  <input
                    value={unit.title}
                    onChange={(event) => onRenameUnit(unit.id, event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-black text-gray-950 outline-none dark:text-white"
                    aria-label={`Nome da unidade ${unitIndex + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteUnit(unit.id)}
                    aria-label="Excluir unidade"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <SortableContext items={unit.days.map((lesson, lessonIndex) => `${unit.id}:${lesson.id}:${lessonIndex}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 p-4">
                      {unit.days.length === 0 && <EmptyUnitDropZone unitId={unit.id} />}

                      {unit.days.map((lesson, lessonIndex) => (
                        <SortableLessonRow
                          key={`${unit.id}:${lesson.id}:${lessonIndex}`}
                          unitId={unit.id}
                          lesson={lesson}
                          lessonIndex={lessonIndex}
                          onRenameLesson={onRenameLesson}
                          onDeleteLesson={onDeleteLesson}
                          onOpenLesson={onOpenLesson}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => onAddLesson(unit.id)}
                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 text-sm font-black text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-100/70 dark:text-violet-300"
                      >
                        <Plus size={16} />
                        Adicionar aula nesta unidade
                      </button>
                  </div>
                </SortableContext>
              </div>
            ))}

            <button
              type="button"
              onClick={onAddUnit}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-white text-sm font-black text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
            >
              <Plus size={16} />
              Nova unidade
            </button>
          </div>
        </DndContext>
      )}
    </section>
  );
};

export default LessonStructurePanel;

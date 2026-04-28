"use client";

import React from 'react';
import { BookOpen, ChevronRight, FileText, GripVertical, Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import type { PlanWeek } from '../../types';
import type { LessonStructurePanelProps } from './types';
import { getPlanLessonCount } from './planStudioProgress';

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceUnitIndex = weeks.findIndex((unit) => unit.id === result.source.droppableId);
    const destinationUnitIndex = weeks.findIndex((unit) => unit.id === result.destination?.droppableId);
    if (sourceUnitIndex < 0 || destinationUnitIndex < 0) return;

    const nextWeeks: PlanWeek[] = weeks.map((unit) => ({ ...unit, days: [...unit.days] }));
    const [movedLesson] = nextWeeks[sourceUnitIndex].days.splice(result.source.index, 1);
    nextWeeks[destinationUnitIndex].days.splice(result.destination.index, 0, movedLesson);
    onReorderUnits(nextWeeks);
  };

  return (
    <section className="rounded-[22px] border border-[#e7dfd2] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
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
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c5a059] px-4 text-sm font-black text-white shadow-lg shadow-[#c5a059]/20"
        >
          <Plus size={18} />
          Nova aula
        </button>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#d8cdbc] bg-[#fbfaf7] px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <BookOpen size={36} className="mx-auto mb-3 text-[#c5a059]" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Comece pela primeira unidade</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Crie uma unidade para organizar as aulas da sala.</p>
          <button
            type="button"
            onClick={onAddUnit}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5d4037] px-5 text-sm font-black text-white"
          >
            <Plus size={16} />
            Criar unidade
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-5">
            {weeks.map((unit, unitIndex) => (
              <div key={unit.id} className="overflow-hidden rounded-2xl border border-[#e7dfd2] bg-[#fbfaf7] dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-[#e7dfd2] p-4 dark:border-gray-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5d4037] text-sm font-black text-white">
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

                <Droppable droppableId={unit.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 p-4">
                      {unit.days.length === 0 && (
                        <p className="rounded-xl border border-dashed border-[#d8cdbc] py-5 text-center text-sm font-medium text-gray-400">
                          Nenhuma aula nesta unidade.
                        </p>
                      )}

                      {unit.days.map((lesson, lessonIndex) => (
                        <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`group flex items-center gap-3 rounded-2xl border border-[#e7dfd2] bg-white p-3 transition-all dark:border-gray-800 dark:bg-[#0f0f0f] ${
                                snapshot.isDragging ? 'shadow-2xl ring-2 ring-[#c5a059]' : 'shadow-sm'
                              }`}
                            >
                              <button
                                type="button"
                                {...dragProvided.dragHandleProps}
                                className="flex h-10 w-8 shrink-0 items-center justify-center text-gray-300"
                                aria-label="Reordenar aula"
                              >
                                <GripVertical size={18} />
                              </button>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7efe0] text-[#c5a059]">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <input
                                  value={lesson.title}
                                  onChange={(event) => onRenameLesson(unit.id, lesson.id, event.target.value)}
                                  placeholder="Titulo da aula"
                                  className="w-full bg-transparent text-sm font-black text-gray-950 outline-none dark:text-white"
                                  aria-label="Titulo da aula"
                                />
                                <p className="truncate text-xs text-gray-500">{lesson.description || 'Sem descricao definida'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onOpenLesson(unit.id, lesson)}
                                className="hidden min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-black text-[#5d4037] transition-colors hover:bg-[#f7efe0] sm:inline-flex"
                              >
                                Editar
                                <ChevronRight size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteLesson(unit.id, lesson.id)}
                                aria-label="Excluir aula"
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <button
                        type="button"
                        onClick={() => onAddLesson(unit.id)}
                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d8cdbc] text-sm font-black text-[#c5a059] transition-colors hover:border-[#c5a059] hover:bg-[#f7efe0]/60"
                      >
                        <Plus size={16} />
                        Adicionar aula nesta unidade
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}

            <button
              type="button"
              onClick={onAddUnit}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#e7dfd2] bg-white text-sm font-black text-[#5d4037] transition-colors hover:bg-[#fbfaf7] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <Plus size={16} />
              Nova unidade
            </button>
          </div>
        </DragDropContext>
      )}
    </section>
  );
};

export default LessonStructurePanel;

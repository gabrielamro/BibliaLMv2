"use client";

import React, { useState } from 'react';
import { Check, ChevronDown, GraduationCap, ImageIcon, Sparkles, Upload, Users } from 'lucide-react';
import type { CustomPlan } from '../../types';
import { getPlanLessonCount, getPlanStudioChecklist } from './planStudioProgress';

interface PublishChecklistPanelProps {
  plan: Partial<CustomPlan>;
  onOpenEvaluation: () => void;
  onGenerateWithAI: () => void;
  onImportLessons: () => void;
  showEvaluationAction?: boolean;
}

const PublishChecklistPanel: React.FC<PublishChecklistPanelProps> = ({
  plan,
  onOpenEvaluation,
  onGenerateWithAI,
  onImportLessons,
  showEvaluationAction = true,
}) => {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const checklist = getPlanStudioChecklist(plan);
  const completedItems = checklist.filter((item) => item.complete).length;
  const totalItems = checklist.length;
  const completion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const lessons = getPlanLessonCount(plan);

  return (
    <aside className="space-y-4">
      <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
        <button
          type="button"
          onClick={() => setIsChecklistOpen((current) => !current)}
          className="flex w-full items-start justify-between gap-4 text-left"
          aria-expanded={isChecklistOpen}
        >
          <div className="min-w-0">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Pronto para publicar</p>
            <h2 className="text-xl font-black text-gray-950 dark:text-white">Checklist da sala</h2>
            <p className="mt-2 text-sm text-gray-500">Acompanhe o preparo da sala sem passar por um wizard linear.</p>
            <p className="mt-3 text-sm font-black text-purple-700 dark:text-violet-300">{completedItems}/{totalItems} concluídos</p>
          </div>
          <ChevronDown className={`mt-1 flex-none text-purple-700 transition-transform dark:text-violet-300 ${isChecklistOpen ? 'rotate-180' : ''}`} size={18} />
        </button>

        {isChecklistOpen && (
          <>
            <div className="mt-5">
              <div className="h-2.5 overflow-hidden rounded-full bg-purple-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-purple-700 transition-all dark:bg-violet-500" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      item.complete
                        ? 'border-purple-700 bg-purple-700 text-white dark:border-violet-500 dark:bg-violet-500'
                        : 'border-purple-100 bg-purple-50 text-transparent dark:border-gray-700 dark:bg-gray-900'
                    }`}
                  >
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.helper}</p>
                  </div>
                </div>
              ))}
            </div>

            {showEvaluationAction && (
              <button
                type="button"
                onClick={onOpenEvaluation}
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 text-sm font-black text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
              >
                <GraduationCap size={16} />
                {plan.hasEvaluation ? 'Editar avaliacao' : 'Criar avaliacao'}
              </button>
            )}
          </>
        )}
      </section>

      <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Experiencia do aluno</p>
        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/40 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b174f] via-purple-700 to-violet-500">
              {plan.coverUrl ? (
                <img src={plan.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="text-white/80" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-gray-950 dark:text-white">{plan.title || 'Nova sala'}</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {(plan.weeks ?? []).length} unidades - {lessons} aulas
              </p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-purple-700 dark:text-violet-300">
                {plan.status === 'published' ? 'Inscricoes abertas' : 'Previa de rascunho'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Acoes rapidas</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <button
            type="button"
            onClick={onGenerateWithAI}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-100 px-3 text-xs font-black text-purple-800 dark:bg-purple-950/40 dark:text-violet-200"
          >
            <Sparkles size={14} />
            Gerar com IA
          </button>
          <button
            type="button"
            onClick={onImportLessons}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-3 text-xs font-black text-gray-600 hover:border-purple-300 dark:border-purple-900/40 dark:bg-gray-900 dark:text-gray-300"
          >
            <Upload size={14} />
            Importar aulas
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-gray-500 dark:bg-gray-900">
          <Users size={14} />
          Area de alunos sera conectada depois da escolha da pagina final.
        </div>
      </section>
    </aside>
  );
};

export default PublishChecklistPanel;

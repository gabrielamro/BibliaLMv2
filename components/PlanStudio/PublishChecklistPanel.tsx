"use client";

import React from 'react';
import { Check, GraduationCap, ImageIcon, Sparkles, Upload, Users } from 'lucide-react';
import type { CustomPlan } from '../../types';
import { getPlanLessonCount, getPlanStudioChecklist, getPlanStudioCompletion } from './planStudioProgress';

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
  const checklist = getPlanStudioChecklist(plan);
  const completion = getPlanStudioCompletion(plan);
  const lessons = getPlanLessonCount(plan);

  return (
    <aside className="space-y-4">
      <section className="rounded-[22px] border border-[#e7dfd2] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Pronto para publicar</p>
        <h2 className="text-xl font-black text-gray-950 dark:text-white">Checklist da sala</h2>
        <p className="mt-2 text-sm text-gray-500">Acompanhe o preparo da sala sem passar por um wizard linear.</p>

        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-[#efe7da] dark:bg-gray-800">
            <div className="h-full rounded-full bg-green-700 transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-3 text-sm font-black text-green-700">{completion}% completo</p>
        </div>

        <div className="mt-5 space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  item.complete
                    ? 'border-green-700 bg-green-700 text-white'
                    : 'border-[#d8cdbc] bg-[#f7f2e9] text-transparent dark:border-gray-700 dark:bg-gray-900'
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
            className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] text-sm font-black text-[#5d4037] transition-colors hover:bg-[#f7efe0] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <GraduationCap size={16} />
            {plan.hasEvaluation ? 'Editar avaliacao' : 'Criar avaliacao'}
          </button>
        )}
      </section>

      <section className="rounded-[22px] border border-[#e7dfd2] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Experiencia do aluno</p>
        <div className="rounded-2xl border border-[#e7dfd2] bg-[#fbfaf7] p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-500 via-[#c5a059] to-[#5d4037]">
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
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
                {plan.status === 'published' ? 'Inscricoes abertas' : 'Previa de rascunho'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-[#e7dfd2] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Acoes rapidas</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <button
            type="button"
            onClick={onGenerateWithAI}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f7efe0] px-3 text-xs font-black text-[#5d4037]"
          >
            <Sparkles size={14} />
            Gerar com IA
          </button>
          <button
            type="button"
            onClick={onImportLessons}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e7dfd2] bg-white px-3 text-xs font-black text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <Upload size={14} />
            Importar aulas
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fbfaf7] px-3 py-2 text-xs font-bold text-gray-500 dark:bg-gray-900">
          <Users size={14} />
          Area de alunos sera conectada depois da escolha da pagina final.
        </div>
      </section>
    </aside>
  );
};

export default PublishChecklistPanel;

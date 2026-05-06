"use client";

import React from 'react';
import { CheckCircle2, GraduationCap, Info, Lock, Plus } from 'lucide-react';
import type { CustomPlan, StudyEvaluation } from '../../types';

interface EvaluationPanelProps {
  plan: Partial<CustomPlan>;
  savedPlanId: string | null;
  evaluationData: StudyEvaluation | null;
  onOpenEvaluation: () => void;
}

const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  plan,
  savedPlanId,
  evaluationData,
  onOpenEvaluation,
}) => {
  const hasEvaluation = Boolean(plan.hasEvaluation || plan.evaluationId || evaluationData);

  return (
    <section className="rounded-[22px] border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f] xl:col-span-2">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Avaliacao</p>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-violet-300">
            <GraduationCap size={30} />
          </div>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white">Avaliacao da sala</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Crie uma prova final para medir o aprendizado dos alunos. Ela pode ser preparada agora ou adicionada depois que a sala ja estiver publicada.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEvaluation}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-lg shadow-purple-900/15 hover:bg-purple-800 dark:bg-violet-500"
        >
          <Plus size={17} />
          {hasEvaluation ? 'Editar avaliacao' : 'Criar avaliacao'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/40 dark:bg-gray-900">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 dark:bg-[#0f0f0f] dark:text-violet-300">
            {hasEvaluation ? <CheckCircle2 size={20} /> : <Info size={20} />}
          </div>
          <h3 className="text-sm font-black text-gray-950 dark:text-white">Status</h3>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            {hasEvaluation ? 'Avaliacao configurada para esta sala.' : 'Nenhuma avaliacao criada ainda.'}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/40 dark:bg-gray-900">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 dark:bg-[#0f0f0f] dark:text-violet-300">
            <GraduationCap size={20} />
          </div>
          <h3 className="text-sm font-black text-gray-950 dark:text-white">Questoes</h3>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            {evaluationData?.questions?.length ? `${evaluationData.questions.length} questoes configuradas.` : 'Defina perguntas, alternativas e nota minima.'}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/40 dark:bg-gray-900">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 dark:bg-[#0f0f0f] dark:text-violet-300">
            <Lock size={20} />
          </div>
          <h3 className="text-sm font-black text-gray-950 dark:text-white">Disponibilidade</h3>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            {savedPlanId ? 'A avaliacao pode ser salva e vinculada a esta sala.' : 'Salve a sala antes de criar a avaliacao.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default EvaluationPanel;

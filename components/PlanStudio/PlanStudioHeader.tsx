"use client";

import React from 'react';
import { ArrowLeft, DoorOpen, Eye, Loader2, Save, Send } from 'lucide-react';
import type { CustomPlan } from '../../types';

interface PlanStudioHeaderProps {
  plan: Partial<CustomPlan>;
  savedPlanId: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
}

const PlanStudioHeader: React.FC<PlanStudioHeaderProps> = ({
  plan,
  savedPlanId,
  isSaving,
  isPublishing,
  onBack,
  onSave,
  onPublish,
  onPreview,
}) => {
  const statusLabel = plan.status === 'published' ? 'Publicado' : savedPlanId ? 'Rascunho salvo' : 'Novo rascunho';

  return (
    <header className="flex flex-col gap-4 border-b border-purple-100 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md dark:border-purple-900/40 dark:bg-[#0a0a0a]/90 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 text-gray-500 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-purple-900/40 dark:text-gray-400 dark:hover:text-violet-300"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-purple-700 dark:text-violet-300">
              <DoorOpen size={13} />
              Workspace Pastoral / Criar Sala
            </p>
            <h1 className="truncate text-2xl font-black tracking-tight text-gray-950 dark:text-white md:text-3xl">
              {plan.title?.trim() || 'Criar sala'}
            </h1>
          </div>
          <span className="hidden rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-800 dark:bg-purple-950/50 dark:text-violet-200 md:inline-flex">
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
          >
            <Eye size={16} />
            Visualizar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-lg shadow-purple-900/15 transition-transform hover:bg-purple-800 active:scale-[0.98] disabled:opacity-60 dark:bg-violet-500"
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Publicar sala
          </button>
        </div>
      </div>
    </header>
  );
};

export default PlanStudioHeader;

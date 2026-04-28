"use client";

import React from 'react';
import { ArrowLeft, Eye, Loader2, Save, Send } from 'lucide-react';
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
    <header className="flex flex-col gap-4 border-b border-[#e7dfd2] bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-[#0a0a0a]/90 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e7dfd2] text-gray-500 transition-colors hover:border-[#c5a059] hover:text-[#5d4037] dark:border-gray-800 dark:text-gray-400 dark:hover:text-[#c5a059]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
              Workspace Pastoral / Criar Sala
            </p>
            <h1 className="truncate text-2xl font-black tracking-tight text-gray-950 dark:text-white md:text-3xl">
              {plan.title?.trim() || 'Criar sala'}
            </h1>
          </div>
          <span className="hidden rounded-full bg-[#f7efe0] px-3 py-1 text-xs font-black text-[#5d4037] md:inline-flex">
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e7dfd2] bg-white px-4 text-sm font-black text-[#5d4037] transition-colors hover:bg-[#fbfaf7] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <Eye size={16} />
            Visualizar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e7dfd2] bg-white px-4 text-sm font-black text-[#5d4037] transition-colors hover:bg-[#fbfaf7] disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-black text-white shadow-lg shadow-green-900/10 transition-transform active:scale-[0.98] disabled:opacity-60"
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

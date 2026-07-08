"use client";

import React from 'react';
import { Download, Edit3, Lock, Share2, Shield, Unlock, UserPlus } from 'lucide-react';
import type { CustomPlan } from '../../types';

type Props = {
  plan: CustomPlan;
  canDownloadPdf: boolean;
  onEdit: () => void;
  onOpenShare: () => void;
  onDownloadPdf: () => void;
};

const getVisibilityLabel = (plan: CustomPlan) => {
  const visibility = plan.privacyLevel || plan.privacyType;
  if (visibility === 'public') return 'Publico';
  if (visibility === 'church') return 'Igreja';
  if (visibility === 'group' || visibility === 'church_groups') return 'Grupo';
  return 'Privado';
};

const PlanOwnerPreviewActions: React.FC<Props> = ({
  plan,
  canDownloadPdf,
  onEdit,
  onOpenShare,
  onDownloadPdf,
}) => {
  const isPublic = (plan.privacyLevel || plan.privacyType) === 'public';
  const VisibilityIcon = isPublic ? Unlock : Lock;
  const accessActionLabel = isPublic ? 'Privacidade' : 'Convidar';

  return (
    <div className="plan-owner-actions sticky top-3 z-30 mx-auto mb-4 max-w-7xl px-4 print:hidden">
      <div className="flex flex-col gap-3 rounded-2xl border border-purple-200 bg-white/95 p-3 shadow-xl shadow-purple-900/10 backdrop-blur dark:border-purple-800/50 dark:bg-bible-darkPaper/95 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-violet-300">
            <Shield size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-widest text-gray-400">Preview publicada</p>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
              <VisibilityIcon size={15} className="text-purple-700 dark:text-violet-300" />
              <span>{getVisibilityLabel(plan)}</span>
              {plan.allowPdfDownload && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase text-green-600">PDF liberado</span>}
            </div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Edite quem pode acessar as aulas ou envie convites por aqui.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:items-center">
          {canDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:text-violet-200"
            >
              <Download size={15} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:text-violet-200"
          >
            <Edit3 size={15} />
            Editar
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            data-testid="plan-owner-share-button"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-purple-900/15 transition-transform hover:scale-[1.01] hover:bg-purple-800 active:scale-[0.99] dark:bg-violet-500"
          >
            <Share2 size={15} />
            Compartilhar
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            data-testid="plan-owner-privacy-button"
            className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-violet-200 sm:col-span-1"
          >
            <UserPlus size={15} />
            {accessActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanOwnerPreviewActions;

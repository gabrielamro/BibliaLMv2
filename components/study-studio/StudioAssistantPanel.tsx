'use client';

import React from 'react';
import { ArrowRight, Check, Sparkles, WandSparkles } from 'lucide-react';

interface StudioAssistantPanelProps {
  verseReference?: string;
  selectedBlockLabel?: string;
  onOpenBuilder: (prompt?: string) => void;
}

const actions = [
  ['Enriquecer contexto', 'Aprofunde o contexto histórico e pastoral deste estudo.'],
  ['Criar aplicação prática', 'Crie uma aplicação prática clara para o conteúdo selecionado.'],
  ['Transformar em slides', 'Transforme os pontos principais em uma sequência de slides.'],
  ['Revisar clareza', 'Revise a clareza sem alterar o sentido bíblico do conteúdo.'],
] as const;

export const StudioAssistantPanel: React.FC<StudioAssistantPanelProps> = ({
  verseReference,
  selectedBlockLabel,
  onOpenBuilder,
}) => (
  <div className="space-y-4 p-4" data-testid="studio-assistant-panel">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none">
        <Sparkles size={20} />
      </div>
      <div>
        <h2 className="font-bold text-bible-ink dark:text-white">Obreiro IA</h2>
        <p className="mt-0.5 text-[11px] text-gray-500">Copiloto com o contexto do estudo</p>
      </div>
    </div>

    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/40">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">
        Contexto enviado <Check size={13} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {verseReference && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-900">{verseReference}</span>}
        {selectedBlockLabel && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-900">Bloco: {selectedBlockLabel}</span>}
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-900">Culto+</span>
      </div>
    </div>

    <div>
      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-gray-400">O que deseja fazer?</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(([label, prompt]) => (
          <button
            key={label}
            type="button"
            onClick={() => onOpenBuilder(prompt)}
            className="min-h-[72px] rounded-xl border border-gray-200 bg-white p-2.5 text-left text-[10px] font-bold text-bible-ink transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:hover:bg-violet-950/30"
          >
            <WandSparkles size={14} className="mb-2 text-violet-600" />
            {label}
          </button>
        ))}
      </div>
    </div>

    <button
      type="button"
      onClick={() => onOpenBuilder()}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition-colors hover:bg-violet-700"
    >
      Criar estrutura com IA
      <ArrowRight size={15} />
    </button>
    <p className="rounded-xl bg-gray-50 p-3 text-[10px] leading-relaxed text-gray-500 dark:bg-gray-900">
      A IA sugere; você decide. O texto bíblico continua vindo da base bíblica do Culto+.
    </p>
  </div>
);

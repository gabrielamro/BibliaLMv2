'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Plus, Sparkles, X } from 'lucide-react';
import type { Block } from '../Builder';
import { blockLabels } from '../Builder';

export interface StudyAIProposal {
  title?: string;
  description?: string;
  slug?: string;
  blocks: Block[];
}

interface AIProposalReviewProps {
  proposal: StudyAIProposal;
  onApplyAll: () => void;
  onApplySelected: (blockIds: string[]) => void;
  onInsertSelected: (blockIds: string[]) => void;
  onDiscard: () => void;
}

const summarizeBlock = (block: Block) => {
  const values = Object.values(block.data || {})
    .filter((value) => typeof value === 'string')
    .map(String)
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return values.slice(0, 150) || 'Conteúdo estruturado pronto para revisão.';
};

export const AIProposalReview: React.FC<AIProposalReviewProps> = ({
  proposal,
  onApplyAll,
  onApplySelected,
  onInsertSelected,
  onDiscard,
}) => {
  const [selected, setSelected] = useState(() => new Set(proposal.blocks.map((block) => block.id)));
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDiscard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onDiscard]);

  const selectedIds = [...selected];
  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Descartar proposta da IA"
        className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-sm"
        onClick={onDiscard}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-proposal-title"
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#fffefa] shadow-2xl dark:bg-gray-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-700 to-indigo-700 px-5 py-4 text-white sm:px-7">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles size={21} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Proposta do Obreiro IA</p>
              <h2 id="ai-proposal-title" className="mt-1 text-xl font-black">Revise antes de alterar o estudo</h2>
              <p className="mt-1 text-xs text-violet-100">Escolha os blocos que realmente ajudam. Nada foi aplicado ainda.</p>
            </div>
          </div>
          <button type="button" onClick={onDiscard} aria-label="Fechar revisão" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-6">
          {(proposal.title || proposal.description) && (
            <section className="mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Metadados sugeridos</p>
              {proposal.title && <p className="mt-2 font-bold text-bible-ink dark:text-white">{proposal.title}</p>}
              {proposal.description && <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{proposal.description}</p>}
            </section>
          )}

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">{selected.size} de {proposal.blocks.length} blocos selecionados</p>
            <button
              type="button"
              onClick={() => setSelected(selected.size === proposal.blocks.length ? new Set() : new Set(proposal.blocks.map((block) => block.id)))}
              className="min-h-11 rounded-xl px-3 text-xs font-bold text-violet-700 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300 dark:hover:bg-violet-950/30"
            >
              {selected.size === proposal.blocks.length ? 'Limpar seleção' : 'Selecionar tudo'}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {proposal.blocks.map((block) => {
              const checked = selected.has(block.id);
              return (
                <button
                  key={block.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggle(block.id)}
                  className={`min-h-28 rounded-2xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${checked ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-bible-ink dark:text-white">{blockLabels[block.type]?.label || block.type}</span>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${checked ? 'bg-violet-600 text-white' : 'border border-gray-300 text-transparent'}`}>
                      <Check size={14} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-gray-500">{summarizeBlock(block)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="grid gap-2 border-t border-gray-200 bg-white p-4 sm:grid-cols-[auto_1fr_1fr_1fr] dark:border-gray-800 dark:bg-gray-900">
          <button type="button" onClick={onDiscard} className="min-h-11 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Descartar</button>
          <button type="button" disabled={!selectedIds.length} onClick={() => onInsertSelected(selectedIds)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 text-xs font-bold text-violet-700 disabled:opacity-40 dark:border-violet-800 dark:text-violet-300">
            <Plus size={15} /> Aplicar como novos
          </button>
          <button type="button" disabled={!selectedIds.length} onClick={() => onApplySelected(selectedIds)} className="min-h-11 rounded-xl bg-violet-100 px-4 text-xs font-bold text-violet-800 disabled:opacity-40 dark:bg-violet-950 dark:text-violet-200">Aplicar selecionados</button>
          <button type="button" onClick={onApplyAll} className="min-h-11 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white hover:bg-violet-800">Aplicar tudo</button>
        </footer>
      </div>
    </div>
  );
};

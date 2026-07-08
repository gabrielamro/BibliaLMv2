"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, ImageIcon, Loader2, Sparkles, Upload } from 'lucide-react';
import type { PlanningFrequency } from '../../types';
import type { RoomDetailsPanelProps } from './types';

const frequencyOptions: Array<{ value: PlanningFrequency; label: string }> = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'daily', label: 'Diario' },
  { value: 'monthly', label: 'Mensal' },
];

const RoomDetailsPanel: React.FC<RoomDetailsPanelProps> = ({
  plan,
  onChange,
  onFrequencyChange,
  onGenerateCover,
  onAttachCover,
  isGeneratingCover,
  isUploadingCover,
  validationError,
  forceOpenSignal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!forceOpenSignal) return;
    setIsOpen(true);
    window.setTimeout(() => titleInputRef.current?.focus(), 120);
  }, [forceOpenSignal]);

  const titleStatus = plan.title?.trim() ? plan.title.trim() : 'Nome da sala pendente';
  const descriptionStatus = plan.description?.trim() ? 'Descrição preenchida' : 'Descrição opcional';

  return (
  <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
    <button
      type="button"
      onClick={() => setIsOpen((current) => !current)}
      className="mb-4 flex w-full items-center justify-between gap-3 text-left md:pointer-events-none"
      aria-expanded={isOpen}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Dados essenciais</p>
        <p className={`mt-1 truncate text-xs font-bold md:hidden ${validationError ? 'text-red-600' : 'text-gray-500'}`}>
          {validationError || `${titleStatus} • ${descriptionStatus}`}
        </p>
      </div>
      <ChevronDown className={`flex-none text-purple-700 transition-transform md:hidden ${isOpen ? 'rotate-180' : ''}`} size={18} />
    </button>

    <div className={`${isOpen ? 'block' : 'hidden'} md:block`}>
    <div className="mb-6 overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900">
      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#2b174f] via-purple-700 to-violet-500">
        {plan.coverUrl ? (
          <img src={plan.coverUrl} alt="Capa da sala" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={40} className="text-white/80" />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Capa da sala</span>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAttachCover(file);
              event.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCover}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 text-xs font-black text-purple-700 disabled:opacity-60 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
          >
            {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Anexar imagem
          </button>
          <button
            type="button"
            onClick={onGenerateCover}
            disabled={isGeneratingCover}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-purple-100 px-3 text-xs font-black text-purple-800 disabled:opacity-60 dark:bg-purple-950/40 dark:text-violet-200"
          >
            {isGeneratingCover ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Gerar
          </button>
        </div>
      </div>
    </div>

    <div className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Nome da sala</span>
        <input
          ref={titleInputRef}
          value={plan.title ?? ''}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Ex: Vida de Oracao"
          aria-invalid={!!validationError}
          className={`min-h-12 w-full rounded-xl border bg-purple-50/60 px-4 text-sm font-black text-gray-950 outline-none ring-purple-500/30 transition focus:ring-2 dark:bg-gray-900 dark:text-white ${
            validationError ? 'border-red-300 focus:ring-red-500/30 dark:border-red-800' : 'border-purple-100 dark:border-purple-900/40'
          }`}
        />
        {validationError && <span className="mt-2 block text-xs font-bold text-red-600">{validationError}</span>}
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Descricao curta</span>
        <textarea
          value={plan.description ?? ''}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Resumo para os alunos entenderem o objetivo da sala."
          className="h-24 w-full resize-none rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm font-medium text-gray-700 outline-none ring-purple-500/30 transition focus:ring-2 dark:border-purple-900/40 dark:bg-gray-900 dark:text-gray-200"
        />
      </label>

      <div>
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Organizacao</span>
        <div className="grid grid-cols-3 gap-2">
          {frequencyOptions.map((option) => {
            const active = (plan.planningFrequency ?? 'weekly') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFrequencyChange(option.value)}
                className={`min-h-11 rounded-xl border px-2 text-xs font-black transition-colors ${
                  active
                    ? 'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-violet-200'
                    : 'border-purple-100 bg-white text-gray-500 hover:border-purple-300 dark:border-purple-900/40 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            <Calendar size={13} /> Inicio
          </span>
          <input
            type="date"
            value={plan.startDate ?? ''}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="min-h-11 w-full rounded-xl border border-purple-100 bg-purple-50/60 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-purple-900/40 dark:bg-gray-900"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Fim opcional</span>
          <input
            type="date"
            value={plan.endDate ?? ''}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="min-h-11 w-full rounded-xl border border-purple-100 bg-purple-50/60 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-purple-900/40 dark:bg-gray-900"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Acesso</span>
        <select
          value={plan.privacyLevel ?? plan.privacyType ?? 'public'}
          onChange={(event) => {
            const visibility = event.target.value as any;
            onChange({
              privacyLevel: visibility,
              privacyType: visibility === 'public'
                ? 'public'
                : visibility === 'church'
                  ? 'church'
                  : visibility === 'group' || visibility === 'church_groups'
                    ? 'group'
                    : 'followers',
              inviteRequired: visibility === 'invite_only',
            } as any);
          }}
          className="min-h-12 w-full rounded-xl border border-purple-100 bg-purple-50/60 px-4 text-sm font-black text-gray-950 outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-purple-900/40 dark:bg-gray-900 dark:text-white"
        >
          <option value="public">Publico</option>
          <option value="private">Privado do usuario</option>
          <option value="invite_only">Privado com convite</option>
          <option value="church">Membros da igreja</option>
          <option value="group">Membros do grupo</option>
          <option value="church_groups">Grupos especificos da igreja</option>
        </select>
        {(plan.churchId || plan.groupId) && (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-purple-700 dark:text-violet-300">
            Contexto predefinido: {plan.groupId ? 'grupo da igreja' : 'igreja'}
          </p>
        )}
      </label>
    </div>
    </div>
  </section>
  );
};

export default RoomDetailsPanel;

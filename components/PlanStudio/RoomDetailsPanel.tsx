"use client";

import React, { useRef } from 'react';
import { Calendar, ImageIcon, Loader2, Sparkles, Upload } from 'lucide-react';
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
  <section className="rounded-[22px] border border-[#e7dfd2] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
    <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Dados essenciais</p>

    <div className="mb-6 overflow-hidden rounded-2xl border border-[#e7dfd2] bg-[#f6f1e8] dark:border-gray-800 dark:bg-gray-900">
      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-slate-500 via-[#c5a059] to-[#5d4037]">
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
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#e7dfd2] bg-white px-3 text-xs font-black text-[#5d4037] disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Anexar imagem
          </button>
          <button
            type="button"
            onClick={onGenerateCover}
            disabled={isGeneratingCover}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#f7efe0] px-3 text-xs font-black text-[#5d4037] disabled:opacity-60"
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
          value={plan.title ?? ''}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Ex: Vida de Oracao"
          className="min-h-12 w-full rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] px-4 text-sm font-black text-gray-950 outline-none ring-[#c5a059] transition focus:ring-2 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Descricao curta</span>
        <textarea
          value={plan.description ?? ''}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Resumo para os alunos entenderem o objetivo da sala."
          className="h-24 w-full resize-none rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] px-4 py-3 text-sm font-medium text-gray-700 outline-none ring-[#c5a059] transition focus:ring-2 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
                    ? 'border-[#f7efe0] bg-[#f7efe0] text-[#5d4037]'
                    : 'border-[#e7dfd2] bg-white text-gray-500 hover:border-[#c5a059] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
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
            className="min-h-11 w-full rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] px-3 text-sm font-bold outline-none dark:border-gray-800 dark:bg-gray-900"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Fim opcional</span>
          <input
            type="date"
            value={plan.endDate ?? ''}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="min-h-11 w-full rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] px-3 text-sm font-bold outline-none dark:border-gray-800 dark:bg-gray-900"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Acesso</span>
        <select
          value={plan.privacyType ?? 'public'}
          onChange={(event) => onChange({ privacyType: event.target.value as any })}
          className="min-h-12 w-full rounded-xl border border-[#e7dfd2] bg-[#fbfaf7] px-4 text-sm font-black text-gray-950 outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
        >
          <option value="public">Publico</option>
          <option value="followers">Privado com convite</option>
          <option value="group">Membros da celula</option>
          <option value="church">Membros da igreja</option>
        </select>
      </label>
    </div>
  </section>
  );
};

export default RoomDetailsPanel;

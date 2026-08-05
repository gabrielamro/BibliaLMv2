"use client";

import React from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  HeartHandshake,
  Pencil,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import type { DevotionalJourneyStep } from '../../types';

const STAGES: Array<{
  step: DevotionalJourneyStep;
  label: string;
  icon: React.ElementType;
}> = [
  { step: 1, label: 'Ler a Palavra', icon: BookOpen },
  { step: 2, label: 'Refletir', icon: Sparkles },
  { step: 3, label: 'Orar', icon: HeartHandshake },
  { step: 4, label: 'Praticar', icon: Target },
  { step: 5, label: 'Concluir', icon: CheckCircle2 },
];

export interface DevotionalTopCardsProps {
  currentStreak: number;
  bestStreak: number;
  practicalAction: string;
  onRegisterCommitment: () => void;
}

export interface DevotionalStepperCardProps {
  activeStage: DevotionalJourneyStep;
  completedSteps: DevotionalJourneyStep[];
  progress: number;
  onSelectStage: (step: DevotionalJourneyStep) => void;
}

// 1. CARDS SUPERIORES: Seu Progresso + Meu Compromisso
export function DevotionalTopCards({
  currentStreak = 7,
  bestStreak = 21,
  practicalAction,
  onRegisterCommitment,
}: DevotionalTopCardsProps) {
  return (
    <div className="flex h-full flex-col justify-between space-y-3.5">
      {/* CARD 1: SEU PROGRESSO */}
      <section className="flex-1 rounded-2xl border border-[#ece3d4] bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#25221e]/90">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#3d2b1b] dark:text-[#fff8ee]">
          Seu progresso
        </h3>
        <p className="mt-0.5 text-[11px] text-[#7a6b5c] dark:text-[#a69786]">
          Sequência atual
        </p>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-serif text-2xl font-black text-[#edad2c]">
            {currentStreak} dias
          </span>
          <span className="text-[10px] font-medium text-[#8c7b6c] dark:text-[#9e8e7e]">
            Melhor sequência: {bestStreak} dias
          </span>
        </div>

        {/* Chamas de Sequência */}
        <div className="mt-2.5 flex items-center gap-1.5" aria-label={`Sequência de ${currentStreak} dias`}>
          {Array.from({ length: 12 }).map((_, index) => {
            const isActive = index < currentStreak;
            return (
              <Flame
                key={index}
                size={16}
                className={
                  isActive
                    ? 'fill-[#edad2c] text-[#edad2c] drop-shadow-[0_2px_6px_rgba(237,173,44,0.3)]'
                    : 'text-[#d8cfc2] dark:text-white/15'
                }
              />
            );
          })}
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-[#7a6b5c] dark:text-[#b0a191]">
          Continue assim! Deus se alegra na sua constância.
        </p>
      </section>

      {/* CARD 2: MEU COMPROMISSO DE HOJE */}
      <section className="flex-1 rounded-2xl border border-[#ece3d4] bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#25221e]/90">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#3d2b1b] dark:text-[#fff8ee]">
          Meu compromisso de hoje
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7a6b5c] dark:text-[#b0a191]">
          {practicalAction.trim()
            ? `“${practicalAction}”`
            : '“Escolher uma atitude concreta para viver esta Palavra hoje.”'}
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={onRegisterCommitment}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e5dac8] bg-white px-4 py-2 text-xs font-bold text-[#4a3928] shadow-sm transition hover:border-[#edad2c] hover:bg-[#faf7f0] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#ebdccb] dark:hover:bg-[#34302c]"
          >
            <Pencil size={13} className="text-[#edad2c]" />
            <span>Registrar compromisso</span>
          </button>
        </div>
      </section>
    </div>
  );
}

// 2. CARD INFERIOR: Etapas do Estudo
export function DevotionalStepperCard({
  activeStage,
  completedSteps,
  progress,
  onSelectStage,
}: DevotionalStepperCardProps) {
  return (
    <section data-testid="devotional-stage-navigation" className="rounded-2xl border border-[#ece3d4] bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#25221e]/90">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#3d2b1b] dark:text-[#fff8ee]">
            Etapas do estudo
          </h3>
          <p className="mt-0.5 text-[11px] text-[#7a6b5c] dark:text-[#a69786]">
            Continue no seu ritmo.
          </p>
        </div>
        <span className="text-xs font-black tabular-nums text-[#edad2c]">
          {progress}%
        </span>
      </div>

      <div className="mt-3.5 space-y-2" role="tablist" aria-label="Etapas do estudo">
        {STAGES.map(({ step, label }) => {
          const completed = completedSteps.includes(step);
          const active = activeStage === step;
          return (
            <button
              key={step}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Etapa ${step}: ${label}`}
              onClick={() => onSelectStage(step)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? 'border-[#edad2c] bg-[#edad2c]/10 text-[#302316] font-bold shadow-sm ring-1 ring-[#edad2c]/50 dark:border-[#edad2c] dark:bg-[#edad2c]/15 dark:text-[#fff8ee]'
                  : completed
                    ? 'border-[#e2d8c9] bg-[#faf6ef] text-[#4d3d2e] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#ebdccb]'
                    : 'border-[#efe7dc] bg-white/50 text-[#7a6a59] hover:border-[#edad2c]/50 hover:bg-white dark:border-white/5 dark:bg-white/[0.02] dark:text-[#9e8f7f]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#edad2c] text-white shadow-sm'
                      : completed
                        ? 'bg-[#edad2c] text-white'
                        : 'border border-[#d8cfc2] text-[#8c7b6c] dark:border-white/20 dark:text-[#8c7b6c]'
                  }`}
                >
                  {completed ? <Check size={14} strokeWidth={3} /> : step}
                </span>
                <span className="text-xs">{label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// 3. GAVETA MOBILE
interface DevotionalMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  bestStreak: number;
  activeStage: DevotionalJourneyStep;
  completedSteps: DevotionalJourneyStep[];
  progress: number;
  practicalAction: string;
  onSelectStage: (step: DevotionalJourneyStep) => void;
  onRegisterCommitment: () => void;
}

export function DevotionalMobileDrawer({
  isOpen,
  onClose,
  currentStreak,
  bestStreak,
  activeStage,
  completedSteps,
  progress,
  practicalAction,
  onSelectStage,
  onRegisterCommitment,
}: DevotionalMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[85vh] space-y-4 overflow-y-auto rounded-t-[28px] border-t border-[#e2d8c9] bg-[#faf6ef] p-5 shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in slide-in-from-bottom duration-300">
        <div className="mb-4 flex items-center justify-between border-b border-[#e8dfd1] pb-3 dark:border-white/10">
          <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
            Painel do Pão Diário
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4a3928] shadow-sm dark:bg-[#2b2722] dark:text-[#ebdccb]"
          >
            <X size={16} />
          </button>
        </div>

        <DevotionalTopCards
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          practicalAction={practicalAction}
          onRegisterCommitment={() => {
            onRegisterCommitment();
            onClose();
          }}
        />

        <DevotionalStepperCard
          activeStage={activeStage}
          completedSteps={completedSteps}
          progress={progress}
          onSelectStage={(step) => {
            onSelectStage(step);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

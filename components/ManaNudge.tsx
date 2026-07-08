"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';
import { getManaChecklist, getManaProgress } from '../services/gamificationService';

interface ManaNudgeProps {
  profile: UserProfile | null;
  compact?: boolean;
}

const ManaNudge: React.FC<ManaNudgeProps> = ({ profile, compact = false }) => {
  const state = useMemo(() => {
    if (!profile) return null;
    const checklist = getManaChecklist(profile);
    const nextAction = checklist.find(item => !item.isDoneToday) ?? checklist[0];
    const progress = getManaProgress(profile.lifetimeXp || 0);
    return { nextAction, progress, doneCount: checklist.filter(item => item.isDoneToday).length, total: checklist.length };
  }, [profile]);

  if (!profile || !state?.nextAction) return null;

  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 ${compact ? '' : 'shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm dark:bg-black/20 dark:text-amber-200">
          {state.nextAction.isDoneToday ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-200">Ganhe Mana hoje</p>
          <h3 className="mt-1 text-sm font-black text-gray-950 dark:text-white">{state.nextAction.label}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
            {state.doneCount}/{state.total} acoes do checklist. {state.progress.next ? `Faltam ${state.progress.remaining} Mana para ${state.progress.next.name}.` : 'Nivel maximo atual alcancado.'}
          </p>
        </div>
      </div>
      <Link href={state.nextAction.href} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-amber-700">
        Continuar <ArrowRight size={14} />
      </Link>
    </section>
  );
};

export default ManaNudge;

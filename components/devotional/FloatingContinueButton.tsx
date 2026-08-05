"use client";

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FloatingContinueButtonProps {
  onContinue: () => void;
  label?: string;
  isCompleted?: boolean;
}

export default function FloatingContinueButton({
  onContinue,
  label = 'Concluir leitura e continuar',
  isCompleted = false,
}: FloatingContinueButtonProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#edad2c] px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-[#edad2c]/30 backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#d99c22] active:translate-y-0"
      >
        <span>{label}</span>
        {isCompleted ? <Sparkles size={15} /> : <ArrowRight size={15} />}
      </button>
    </div>
  );
}

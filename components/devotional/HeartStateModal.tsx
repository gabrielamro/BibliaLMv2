"use client";

import React, { useState } from 'react';
import { HeartHandshake, Sparkles, X } from 'lucide-react';

export type HeartStateOption = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  recommendation: string;
};

export const HEART_OPTIONS: HeartStateOption[] = [
  {
    id: 'paz',
    emoji: '🕊️',
    label: 'Em paz',
    description: 'Agradecido e pronto para meditar com tranquilidade.',
    recommendation: 'Aproveite este momento de paz para guardar a Palavra profundamente em seu coração.',
  },
  {
    id: 'ansioso',
    emoji: '🌿',
    label: 'Ansioso',
    description: 'Precisando de calma, alívio e descanso no Senhor.',
    recommendation: 'Lembre-se: Filipenses 4:6-7 garante que a paz de Deus guardará seu coração e sua mente.',
  },
  {
    id: 'grato',
    emoji: '🙏',
    label: 'Grato',
    description: 'Desejando louvar e reconhecer a fidelidade de Deus.',
    recommendation: 'A gratidão abre nossos olhos para ver as bençãos cotidianas. Celebre com alegria!',
  },
  {
    id: 'cansado',
    emoji: '😴',
    label: 'Cansado',
    description: 'Buscando renovação de forças físicas e espirituais.',
    recommendation: 'Jesus disse: "Vinde a mim todos os que estais cansados e eu vos aliviarei" (Mateus 11:28).',
  },
  {
    id: 'direcao',
    emoji: '🧭',
    label: 'Buscando direção',
    description: 'Precisando de sabedoria e clareza para decisões.',
    recommendation: 'Provérbios 3:5-6 nos ensina a confiar no Senhor sem depender do próprio entendimento.',
  },
  {
    id: 'esperanca',
    emoji: '🕯️',
    label: 'Preciso de esperança',
    description: 'Procurando conforto, abrigo e renovação da fé.',
    recommendation: 'Salmos 42:11 nos lembra: "Põe a tua esperança em Deus, pois ainda o louvarei".',
  },
];

interface HeartStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: HeartStateOption) => void;
}

export default function HeartStateModal({
  isOpen,
  onClose,
  onSelect,
}: HeartStateModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeOption = HEART_OPTIONS.find((opt) => opt.id === selectedId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[28px] border border-[#f0e4cf] bg-[#fffdf8] p-6 shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#eee4d5] pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
              <HeartHandshake size={20} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
                Como está o seu coração hoje?
              </h2>
              <p className="text-xs text-[#736353] dark:text-[#a89988]">
                Sua resposta ajuda a guiar o seu momento com Deus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ebd9] text-[#4a3928] hover:bg-[#e8dcbf] dark:bg-[#2b2722] dark:text-[#ebdccb]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HEART_OPTIONS.map((opt) => {
            const isSelected = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedId(opt.id)}
                className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                  isSelected
                    ? 'border-[#edad2c] bg-[#edad2c]/15 text-[#302316] shadow-sm dark:text-[#fff7eb]'
                    : 'border-[#eee4d5] bg-white/80 hover:border-[#edad2c]/50 hover:bg-white dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="mt-2 text-xs font-bold">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {activeOption ? (
          <div className="mt-5 rounded-2xl border border-[#edad2c]/30 bg-[#edad2c]/10 p-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-[#edad2c]">
              <Sparkles size={15} />
              <span>Palavra de Encorajamento</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4a3928] dark:text-[#ebdccb]">
              {activeOption.recommendation}
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            disabled={!activeOption}
            onClick={() => {
              if (activeOption) {
                onSelect(activeOption);
                onClose();
              }
            }}
            className="inline-flex w-full min-h-11 items-center justify-center rounded-full bg-[#edad2c] text-xs font-black uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[#d99c22] disabled:opacity-40"
          >
            Iniciar devocional
          </button>
        </div>
      </div>
    </div>
  );
}

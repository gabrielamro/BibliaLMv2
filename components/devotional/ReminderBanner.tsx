"use client";

import React from 'react';
import { Bell } from 'lucide-react';

interface ReminderBannerProps {
  onActivate: () => void;
  isActivated?: boolean;
}

export default function ReminderBanner({
  onActivate,
  isActivated = false,
}: ReminderBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#f0e4cf] bg-[linear-gradient(120deg,_#fffbf2_0%,_#fcf4e4_60%,_#f9eacb_100%)] p-5 shadow-sm sm:p-7 dark:border-[#edad2c]/20 dark:bg-[linear-gradient(120deg,_#28241f_0%,_#221e19_60%,_#1c1813_100%)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Esquerda: Ícone, Textos e CTA */}
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
              <Bell size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#edad2c]">
              Lembrete diário às 08:00
            </span>
          </div>

          <h3 className="mt-2.5 font-serif text-lg font-bold tracking-tight text-[#2d1e11] sm:text-xl dark:text-[#fff8ee]">
            Receba o Pão Diário todos os dias no seu celular.
          </h3>

          <p className="mt-1.5 text-xs leading-relaxed text-[#736353] dark:text-[#b3a493]">
            Um lembrete amoroso para você se conectar com Deus diariamente.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#edad2c] px-5 text-xs font-black uppercase tracking-[0.1em] text-white shadow-md shadow-[#edad2c]/20 transition hover:bg-[#d99c22] active:translate-y-0.5"
            >
              <Bell size={14} />
              <span>{isActivated ? 'Lembrete ativado (08:00)' : 'Ativar lembrete diário'}</span>
            </button>
          </div>
        </div>

        {/* Direita: Mockup do Smartphone */}
        <div className="relative shrink-0 self-center md:self-auto">
          <div className="relative h-40 w-64 rounded-[26px] border-[4px] border-[#382a1d] bg-[#1a1714] p-3 shadow-xl dark:border-[#524131]">
            <div className="mx-auto h-2 w-14 rounded-full bg-[#382a1d] dark:bg-[#524131]" />
            <div className="mt-2.5 rounded-2xl border border-white/10 bg-[#2b2722]/95 p-3 text-white shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5 font-bold text-[#edad2c]">
                  <span>🌾 Pão Diário</span>
                </div>
                <span>08:00</span>
              </div>
              <p className="mt-1 text-xs font-medium leading-snug text-gray-200">
                É tempo de se aproximar do trono da graça. Vamos juntos? 🙏
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

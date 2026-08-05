"use client";

import React from 'react';
import { BookOpen, Compass, Flame, HeartHandshake, Star, Trophy } from 'lucide-react';

interface PersonalEvolutionPanelProps {
  completedDevotionalsCount?: number;
  currentStreak?: number;
  completedTracksCount?: number;
  savedVersesCount?: number;
  savedPrayersCount?: number;
}

export default function PersonalEvolutionPanel({
  completedDevotionalsCount = 28,
  currentStreak = 7,
  completedTracksCount = 2,
  savedVersesCount = 14,
  savedPrayersCount = 19,
}: PersonalEvolutionPanelProps) {
  return (
    <section className="rounded-[24px] border border-[#f0e4cf] bg-[linear-gradient(135deg,_#fffdf8_0%,_#faf5ea_100%)] p-6 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,_#25221e_0%,_#1d1b18_100%)]">
      <div className="flex items-center gap-3 border-b border-[#eee4d5] pb-4 dark:border-white/10">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
          <Trophy size={20} />
        </span>
        <div>
          <h3 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
            Sua Caminhada Espiritual
          </h3>
          <p className="text-xs text-[#736353] dark:text-[#a89988]">
            Indicadores da sua jornada com a Palavra.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Devocionais Lidos', value: completedDevotionalsCount, icon: BookOpen, color: 'text-[#edad2c]' },
          { label: 'Dias Seguidos', value: `${currentStreak}d`, icon: Flame, color: 'text-amber-500' },
          { label: 'Trilhas Concluídas', value: completedTracksCount, icon: Compass, color: 'text-emerald-500' },
          { label: 'Versículos Salvos', value: savedVersesCount, icon: Star, color: 'text-amber-400' },
          { label: 'Orações Registradas', value: savedPrayersCount, icon: HeartHandshake, color: 'text-purple-500' },
        ].map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center rounded-2xl border border-[#eee4d5] bg-white/80 p-4 text-center dark:border-white/10 dark:bg-[#272420]"
            >
              <IconComponent size={20} className={item.color} />
              <span className="mt-2 font-serif text-xl font-bold text-[#302316] dark:text-[#fff7eb]">
                {item.value}
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#736353] dark:text-[#a89988]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import React, { useMemo } from 'react';
import { CalendarDays, Loader2, Pause, Play, Wheat } from 'lucide-react';

interface DevotionalHeroProps {
  userName?: string;
  devotionalTitle?: string;
  formattedDate: string;
  devotionalDate?: string;
  onStart: () => void;
  onListen: () => void;
  isPlaying: boolean;
  isGenerating: boolean;
}

export default function DevotionalHero({
  devotionalTitle,
  devotionalDate,
  onStart,
  onListen,
  isPlaying,
  isGenerating,
}: DevotionalHeroProps) {
  const parsedDate = useMemo(() => {
    let dateObj = new Date();
    if (devotionalDate) {
      const candidate = new Date(`${devotionalDate}T12:00:00`);
      if (!Number.isNaN(candidate.getTime())) {
        dateObj = candidate;
      }
    }
    const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const dayNumber = dateObj.getDate();
    const monthYear = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

    return {
      dayOfWeek: capitalizedDay,
      dayNumber,
      monthYear: capitalizedMonthYear.replace(' de ', ' · '),
    };
  }, [devotionalDate]);

  return (
    <header data-testid="pao-diario-header" className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-[#e8dfd1] bg-[#f7efe1] shadow-md dark:border-white/10 dark:bg-[#1c1a17]">
      {/* Imagem de Fundo de Alta Qualidade (Bíblia Aberta, Xícara de Café e Sol da Manhã) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: `url('/brand/pao_diario_hero_bg.jpg')`
        }}
      />

      {/* Camada Gradient Overlay para legibilidade perfeita do texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf8]/95 via-[#fffdf8]/85 to-transparent dark:from-[#171614]/95 dark:via-[#171614]/80 dark:to-transparent" />

      <div className="relative z-10 flex min-h-[320px] flex-col px-6 py-7 sm:px-10 sm:py-9">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex min-h-8 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b87e14] dark:text-[#edad2c]">
            <Wheat aria-hidden="true" size={14} />
            <span>Pão Diário</span>
          </div>

          <time data-testid="devotional-date" dateTime={devotionalDate} className="min-h-8 shrink-0 pt-1 text-right text-xs font-semibold text-[#786553] lg:hidden dark:text-[#c4b7a7]">
            {parsedDate.dayOfWeek} · {parsedDate.dayNumber} de {parsedDate.monthYear.replace(' · ', ' de ')}
          </time>
        </div>

        <div className="mt-6 flex max-w-2xl flex-1 flex-col sm:mt-7 lg:pr-52">
          <h1 className="max-w-xl font-serif text-2xl font-bold leading-tight tracking-tight text-[#2d1e11] sm:text-4xl lg:text-5xl dark:text-[#fff8ee]">
            {devotionalTitle || 'Aproximando-nos com Confiança: O Trono da Graça'}
          </h1>

          <p className="mt-3 max-w-xl rounded-xl bg-[#fffdf8]/60 px-3 py-2 text-[15px] font-medium leading-6 text-[#4a3928] shadow-sm backdrop-blur-sm dark:bg-[#171614]/60 dark:text-[#e7d8c8]">
            Um estudo breve para ler a Palavra, responder com sinceridade e levar uma decisão para o dia.
          </p>
          <div className="mt-auto pt-5">
            <p className="text-xs font-semibold text-[#786553] dark:text-[#b9aa98]">Leitura guiada · cerca de 5 minutos</p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#edad2c] px-7 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-[#edad2c]/30 transition hover:-translate-y-0.5 hover:bg-[#d99c22] active:translate-y-0"
            >
              Começar estudo
            </button>

            <button
              type="button"
              onClick={onListen}
              disabled={isGenerating}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#dcd3c4] bg-white/95 px-6 text-xs font-bold text-[#4d3a2a] shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-[#2a2723] dark:text-[#ebdccb] dark:hover:bg-[#34302c]"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin text-[#edad2c]" />
              ) : isPlaying ? (
                <Pause size={16} className="text-[#edad2c]" />
              ) : (
                <Play size={16} className="fill-[#4d3a2a] text-[#4d3a2a] dark:fill-[#ebdccb] dark:text-[#ebdccb]" />
              )}
              <span>{isGenerating ? 'Preparando...' : isPlaying ? 'Pausar' : 'Ouvir'}</span>
            </button>
            </div>
          </div>
        </div>

        <aside data-testid="devotional-desktop-date-card" aria-label={`Devocional de ${parsedDate.dayOfWeek}, ${parsedDate.dayNumber} de ${parsedDate.monthYear.replace(' · ', ' de ')}`} className="absolute right-10 top-1/2 hidden w-40 -translate-y-1/2 flex-col items-center justify-center rounded-[26px] border border-[#e5dcd0]/80 bg-[#fffbf5]/95 px-5 py-7 text-center shadow-xl backdrop-blur lg:flex dark:border-white/10 dark:bg-[#25221e]/95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edad2c]/15 text-[#edad2c]">
            <CalendarDays aria-hidden="true" size={20} />
          </div>
          <span className="mt-3 text-xs font-bold text-[#4a3928] dark:text-[#ebdccb]">{parsedDate.dayOfWeek}</span>
          <span className="mt-1 font-serif text-5xl font-extrabold tracking-tight text-[#2d1e11] dark:text-[#fff8ee]">{parsedDate.dayNumber}</span>
          <span className="mt-1 text-xs font-bold text-[#5c4a3a] dark:text-[#b3a493]">{parsedDate.monthYear}</span>
          <div className="mt-4 w-full border-t border-[#eae1d4] pt-3 dark:border-white/10">
            <p className="text-[10px] font-medium leading-relaxed text-[#8c7b6c] dark:text-[#9e8f7f]">Volte amanhã para<br />um novo devocional</p>
          </div>
        </aside>
      </div>
    </header>
  );
}

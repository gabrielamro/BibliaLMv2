"use client";

import React, { useMemo } from 'react';
import { CalendarDays, Headphones, Loader2, Pause, Play } from 'lucide-react';

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

      <div className="relative z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 min-h-[320px]">
        {/* Breadcrumb Topo Esquerdo */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#edad2c]">
          <span>🌾 PÃO DIÁRIO</span>
          <span>›</span>
        </div>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Coluna da Esquerda: Título do Devocional e Ações (Sem a saudação "Boa tarde...") */}
          <div className="max-w-xl">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#2d1e11] sm:text-4xl lg:text-5xl dark:text-[#fff8ee]">
              {devotionalTitle || 'Aproximando-nos com Confiança: O Trono da Graça'}
            </h1>
            
            <p className="mt-3 text-xs leading-relaxed text-[#5c4a3a] sm:text-sm dark:text-[#c4b7a7]">
              Um estudo breve para ler a Palavra, responder com sinceridade e levar uma decisão para o dia.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
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

          {/* Coluna da Direita: Card Flutuante de Data TALL (1:1 à Imagem 2 e 3) */}
          <div className="shrink-0 self-center lg:self-auto">
            <div className="flex w-44 flex-col items-center justify-center rounded-[26px] border border-[#e5dcd0]/80 bg-[#fffbf5]/95 px-5 py-7 text-center shadow-xl backdrop-blur sm:w-48 dark:border-white/10 dark:bg-[#25221e]/95">
              {/* Ícone de Calendário */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edad2c]/15 text-[#edad2c]">
                <CalendarDays size={20} />
              </div>

              {/* Dia da Semana */}
              <span className="mt-3 text-xs font-bold text-[#4a3928] dark:text-[#ebdccb]">
                {parsedDate.dayOfWeek}
              </span>

              {/* Número do Dia (Grande Serifado) */}
              <span className="mt-1 font-serif text-5xl font-extrabold tracking-tight text-[#2d1e11] dark:text-[#fff8ee]">
                {parsedDate.dayNumber}
              </span>

              {/* Mês · Ano */}
              <span className="mt-1 text-xs font-bold text-[#5c4a3a] dark:text-[#b3a493]">
                {parsedDate.monthYear}
              </span>

              {/* Linha Divisória */}
              <div className="mt-4 w-full border-t border-[#eae1d4] pt-3 dark:border-white/10">
                <p className="text-[10px] font-medium leading-relaxed text-[#8c7b6c] dark:text-[#9e8f7f]">
                  Volte amanhã para<br />um novo devocional
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

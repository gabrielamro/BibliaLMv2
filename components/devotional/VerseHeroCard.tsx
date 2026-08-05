"use client";

import React from 'react';
import { Share2, Sun } from 'lucide-react';

interface VerseHeroCardProps {
  verseText: string;
  verseReference: string;
  onShare: () => void;
}

export default function VerseHeroCard({
  verseText,
  verseReference,
  onShare,
}: VerseHeroCardProps) {
  return (
    <section data-testid="devotional-verse-overview" className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border border-[#f0e4cf] bg-[linear-gradient(135deg,_#fffdf7_0%,_#fcf4e4_50%,_#f9eacb_100%)] p-6 shadow-sm dark:border-[#edad2c]/20 dark:bg-[linear-gradient(135deg,_#292520_0%,_#231f1a_50%,_#1d1914_100%)]">
      {/* Nuvens e pássaros em segundo plano */}
      <div 
        className="pointer-events-none absolute inset-0 bg-contain bg-right-top bg-no-repeat opacity-10 dark:opacity-15"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><path fill="%23edad2c" d="M320,40 Q330,30 340,40 Q350,30 360,40 Q350,45 340,42 Q330,45 320,40 Z M280,60 Q287,52 295,60 Q302,52 310,60 M340,80 Q345,74 350,80 Q355,74 360,80"/></svg>')`
        }}
      />

      {/* Aspas Decorativas 66 e 99 */}
      <span className="pointer-events-none absolute left-4 top-3 font-serif text-4xl font-black text-[#edad2c]/30 sm:left-6 sm:top-4 sm:text-5xl select-none">
        “
      </span>
      <span className="pointer-events-none absolute bottom-3 right-4 font-serif text-4xl font-black text-[#edad2c]/30 sm:bottom-4 sm:right-6 sm:text-5xl select-none">
        ”
      </span>

      {/* Conteúdo Centralizado Vertical e Horizontalmente */}
      <div className="relative z-10 my-auto flex w-full max-w-2xl flex-col items-center justify-center text-center">
        {/* Badge Versículo do Dia */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#edad2c]/35 bg-[#edad2c]/12 px-3.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#b87e14] dark:text-[#edad2c]">
          <Sun size={12} className="text-[#edad2c]" />
          <span>Versículo do dia</span>
        </div>

        {/* Texto do Versículo */}
        <blockquote
          data-testid="devotional-main-verse"
          className="mt-3.5 font-serif text-base font-normal leading-relaxed text-[#2c1f13] sm:text-lg sm:leading-relaxed dark:text-[#f7eee1]"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
        >
          “{verseText}”
        </blockquote>

        {/* Referência Bíblica (#edad2c) */}
        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#edad2c]">
          {verseReference}
        </p>

        {/* Botão Compartilhar Versículo */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#e5dac8] bg-white/95 px-4 text-xs font-bold text-[#4a3928] shadow-sm backdrop-blur transition hover:border-[#edad2c] hover:bg-white hover:text-[#2d1e11] active:translate-y-0.5 dark:border-white/10 dark:bg-[#2b2722] dark:text-[#ebdccb] dark:hover:border-[#edad2c] dark:hover:bg-[#322e28]"
          >
            <Share2 size={13} className="text-[#edad2c]" />
            <span>Compartilhar versículo</span>
          </button>
        </div>
      </div>
    </section>
  );
}

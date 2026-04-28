import React, { useState, useRef, useEffect, useCallback } from 'react';
import { bibleService } from '../../../services/bibleService';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface RelatedVersesBlockProps {
  data: any;
  layoutWidth?: string;
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
}

export const RelatedVersesBlock: React.FC<RelatedVersesBlockProps> = ({ data, layoutWidth = '1/1' }) => {
  const verses = Array.isArray(data.verses) ? data.verses : [];
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const getGridClass = () => {
    switch (layoutWidth) {
      case '1/1': return 'md:grid-cols-3';
      case '1/2': return 'md:grid-cols-2';
      case '1/3': return 'md:grid-cols-1';
      default: return 'md:grid-cols-3';
    }
  };

  const handleOpenVerse = (reference: string) => {
    const parsed = bibleService.parseReference(reference);
    if (parsed) {
      const url = `/biblia?book=${parsed.bookId}&cap=${parsed.chapter}&vs=${parsed.startVerse}`;
      window.open(url, '_blank');
    }
  };

  const goToSlide = useCallback((index: number) => {
    if (index < 0) index = verses.length - 1;
    if (index >= verses.length) index = 0;
    setActiveSlide(index);
  }, [verses.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide(activeSlide + 1);
      else goToSlide(activeSlide - 1);
    }
  };

  if (verses.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-[#eadfcf] bg-white/82 p-4 sm:p-6 md:p-8 shadow-[0_22px_60px_rgba(59,44,25,0.08)]">
      <div className="mb-5 md:mb-8">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b3874c]">
          {data.title || 'Versículos Relacionados'}
        </h2>
        {data.description && (
          <p className="mt-2 md:mt-3 text-sm md:text-base text-[#7b6c5e] font-serif italic leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {/* === DESKTOP: Grid de 3 colunas === */}
      <div className={`hidden md:grid gap-6 w-full ${getGridClass()}`}>
        {verses.map((verse: any, index: number) => (
          <article 
            key={`desktop-${verse.reference}-${index}`} 
            onClick={() => handleOpenVerse(verse.reference)}
            className="group relative flex flex-col justify-between rounded-3xl border border-[#efe3d3] bg-[#fcfaf7] p-7 transition-all hover:border-[#b3874c]/30 hover:shadow-xl cursor-pointer overflow-hidden h-full min-h-[180px]"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#b3874c] bg-[#eadfcf]/40 px-3 py-1.5 rounded-lg">
                  {verse.reference}
                </span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[#b3874c] opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink size={12} />
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-[#4a3f35] font-medium flex-1">
                {verse.summary}
              </p>
            </div>
            <div className="absolute bottom-2 right-4 text-[#b3874c]/5 font-serif text-[120px] leading-none italic select-none pointer-events-none group-hover:scale-105 transition-transform duration-700">
              {index + 1}
            </div>
          </article>
        ))}
      </div>

      {/* === MOBILE: Slider com 1 versículo por vez === */}
      <div className="md:hidden">
        <div 
          ref={slideRef}
          className="relative overflow-hidden rounded-3xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {verses.map((verse: any, index: number) => (
              <article 
                key={`mobile-${verse.reference}-${index}`}
                onClick={() => handleOpenVerse(verse.reference)}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#efe3d3] bg-[#fcfaf7] p-6 cursor-pointer overflow-hidden min-h-[200px] w-full flex-shrink-0"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#b3874c] bg-[#eadfcf]/40 px-3 py-1.5 rounded-lg">
                      {verse.reference}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[#b3874c]">
                      <ExternalLink size={12} />
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#4a3f35] font-medium flex-1">
                    {verse.summary}
                  </p>
                </div>
                <div className="absolute bottom-2 right-4 text-[#b3874c]/5 font-serif text-[100px] leading-none italic select-none pointer-events-none">
                  {index + 1}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Controles do Slider */}
        {verses.length > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            {/* Botão Anterior */}
            <button
              onClick={() => goToSlide(activeSlide - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-[#eadfcf] bg-white text-[#b3874c] active:scale-90 transition-all shadow-sm"
              aria-label="Versículo anterior"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Indicadores (bolinhas) */}
            <div className="flex items-center gap-2">
              {verses.map((_: any, i: number) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => goToSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeSlide 
                      ? 'w-6 h-2.5 bg-[#b3874c]' 
                      : 'w-2.5 h-2.5 bg-[#eadfcf] hover:bg-[#d4c4ae]'
                  }`}
                  aria-label={`Versículo ${i + 1}`}
                />
              ))}
            </div>

            {/* Botão Próximo */}
            <button
              onClick={() => goToSlide(activeSlide + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-[#eadfcf] bg-white text-[#b3874c] active:scale-90 transition-all shadow-sm"
              aria-label="Próximo versículo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

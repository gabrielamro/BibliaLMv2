import React from 'react';
import { bibleService } from '../../../services/bibleService';
import { ExternalLink } from 'lucide-react';

interface RelatedVersesBlockProps {
  data: any;
  layoutWidth?: string;
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
}

export const RelatedVersesBlock: React.FC<RelatedVersesBlockProps> = ({ data, layoutWidth = '1/1' }) => {
  const verses = Array.isArray(data.verses) ? data.verses : [];

  const getGridClass = () => {
    switch (layoutWidth) {
      case '1/1': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '1/2': return 'grid-cols-1 md:grid-cols-2';
      case '1/3': return 'grid-cols-1';
      default: return 'grid-cols-1 md:grid-cols-3';
    }
  };

  const handleOpenVerse = (reference: string) => {
    const parsed = bibleService.parseReference(reference);
    if (parsed) {
      const url = `/biblia?book=${parsed.bookId}&cap=${parsed.chapter}&vs=${parsed.startVerse}`;
      window.open(url, '_blank');
    }
  };

  return (
    <section className="rounded-[28px] border border-[#eadfcf] bg-white/82 p-6 md:p-8 shadow-[0_22px_60px_rgba(59,44,25,0.08)]">
      <div className="mb-8">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b3874c]">
          {data.title || 'Versículos Relacionados'}
        </h2>
        {data.description && (
          <p className="mt-3 text-base text-[#7b6c5e] font-serif italic leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      <div className={`grid gap-6 w-full ${getGridClass()}`}>
        {verses.map((verse: any, index: number) => (
          <article 
            key={`${verse.reference}-${index}`} 
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

            {/* Decorative background number - matching the image's style */}
            <div className="absolute bottom-2 right-4 text-[#b3874c]/5 font-serif text-[120px] leading-none italic select-none pointer-events-none group-hover:scale-105 transition-transform duration-700">
              {index + 1}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

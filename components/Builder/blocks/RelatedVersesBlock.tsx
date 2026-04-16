import React from 'react';

interface RelatedVersesBlockProps {
  data: any;
}

export const RelatedVersesBlock: React.FC<RelatedVersesBlockProps> = ({ data }) => {
  const verses = Array.isArray(data.verses) ? data.verses : [];

  return (
    <section className="rounded-[28px] border border-[#eadfcf] bg-white/82 p-5 shadow-[0_22px_60px_rgba(59,44,25,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">{data.title || 'Versiculos Relacionados'}</p>
      <p className="mt-1 text-sm text-[#7b6c5e]">{data.description}</p>
      <div className="mt-5 space-y-4">
        {verses.map((verse: any, index: number) => (
          <article key={`${verse.reference}-${index}`} className="rounded-2xl border border-[#efe3d3] bg-[#fcfaf7] p-4">
            <h3 className="text-sm font-semibold text-[#b3874c]">{verse.reference}</h3>
            <p className="mt-3 text-sm leading-7 text-[#66594c]">{verse.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

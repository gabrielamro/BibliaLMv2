import React from 'react';

interface HeroSplitBlockProps {
  data: any;
  isEditing: boolean;
  onUpdate?: (data: any) => void;
}

export const HeroSplitBlock: React.FC<HeroSplitBlockProps> = ({ data, isEditing }) => {
  return (
    <section className="grid overflow-hidden rounded-[1.75rem] border border-[#eadfcf] bg-[linear-gradient(135deg,_#f6efe3_0%,_#f4ede2_50%,_#efe4d5_100%)] sm:rounded-[2rem] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-[200px] overflow-hidden bg-[radial-gradient(circle_at_25%_20%,_rgba(252,226,176,0.35),_transparent_35%),linear-gradient(135deg,_rgba(78,59,35,0.88)_0%,_rgba(35,28,21,0.86)_44%,_rgba(18,14,10,0.94)_100%)] sm:min-h-[240px]">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.imageAlt || 'Hero split'} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute bottom-10 left-8 right-8 rounded-[30px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-sm sm:left-12 sm:right-auto sm:w-[72%]">
            <div className="h-28 rounded-[24px] border border-white/15 bg-[radial-gradient(circle_at_top,_rgba(255,243,220,0.65),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.16)_0%,_rgba(255,255,255,0.05)_100%)]" />
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[#e6d8bf]">
              {isEditing ? 'Adicione uma imagem no painel lateral' : 'Visual contemplativo'}
            </p>
          </div>
        )}
      </div>
      <div className="flex min-h-[190px] items-center px-6 py-8 sm:min-h-[240px] sm:px-12 sm:py-10">
        <div className="max-w-lg">
          <p className="inline-flex rounded-full border border-[#d7c7aa] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c6b3e] sm:text-[11px] sm:tracking-[0.24em]">
            {data.eyebrow || 'Hero split'}
          </p>
          <p className="mt-5 [overflow-wrap:anywhere] font-serif text-[1.45rem] leading-[1.32] text-[#7a5942] sm:mt-6 sm:text-[2.65rem] sm:leading-[1.35]">
            {data.title}
          </p>
          <div className="mt-6 h-px w-40 bg-[#d7c7aa]" />
        </div>
      </div>
    </section>
  );
};

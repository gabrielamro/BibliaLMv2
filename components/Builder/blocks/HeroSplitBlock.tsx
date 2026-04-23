import React from 'react';

interface HeroSplitBlockProps {
  data: any;
  isEditing: boolean;
  onUpdate?: (data: any) => void;
}

export const HeroSplitBlock: React.FC<HeroSplitBlockProps> = ({ data, isEditing }) => {
  return (
    <section className="grid overflow-hidden rounded-[2rem] border border-[#eadfcf] bg-[linear-gradient(135deg,_#f6efe3_0%,_#f4ede2_50%,_#efe4d5_100%)] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-[240px] overflow-hidden bg-[radial-gradient(circle_at_25%_20%,_rgba(252,226,176,0.35),_transparent_35%),linear-gradient(135deg,_rgba(78,59,35,0.88)_0%,_rgba(35,28,21,0.86)_44%,_rgba(18,14,10,0.94)_100%)]">
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
      <div className="flex min-h-[240px] items-center px-8 py-10 sm:px-12">
        <div className="max-w-lg">
          <p className="inline-flex rounded-full border border-[#d7c7aa] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8c6b3e]">
            {data.eyebrow || 'Hero split'}
          </p>
          <p className="mt-6 font-serif text-3xl leading-[1.35] text-[#7a5942] sm:text-[2.65rem]">
            {data.title}
          </p>
          <div className="mt-6 h-px w-40 bg-[#d7c7aa]" />
        </div>
      </div>
    </section>
  );
};

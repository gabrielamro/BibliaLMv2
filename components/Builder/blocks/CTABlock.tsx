"use client";

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from '../../../utils/router';

interface CTABlockProps {
  data: {
    headline: string;
    subheadline: string;
    primaryText: string;
    secondaryText: string;
    primaryStyle: string;
    backgroundStyle: string;
    padding: number;
  };
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
}

const CTA_STYLES = {
  gradient: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
  solid: 'bg-bible-gold text-white',
  outline: 'border-2 border-bible-gold text-bible-gold hover:bg-bible-gold/5',
};

const BG_STYLES = {
  warm: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20',
  cool: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20',
  neutral: 'bg-gray-50 dark:bg-gray-900',
};

export const CTABlock: React.FC<CTABlockProps> = ({ data, isEditing = false }) => {
  const navigate = useNavigate();
  const headline = data.headline || 'Crie seus próprios estudos';
  const subheadline = data.subheadline || 'Junte-se à comunidade BibleLM';
  const primaryText = data.primaryText || 'Começar Gratuitamente';
  const secondaryText = data.secondaryText || 'Ver mais estudos';
  const bgStyle = BG_STYLES[data.backgroundStyle as keyof typeof BG_STYLES] || BG_STYLES.warm;
  const primaryStyle = CTA_STYLES[data.primaryStyle as keyof typeof CTA_STYLES] || CTA_STYLES.gradient;

  if (isEditing) {
    return (
      <section className={`rounded-[28px] p-8 md:p-12 ${bgStyle} border-2 border-dashed border-[#e2ceb0]`}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 bg-white/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="text-bible-gold" size={28} />
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-bible-ink dark:text-white mb-3">
            {headline}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95 ${primaryStyle}`}
            >
              {primaryText}
              <ArrowRight size={18} />
            </button>
            
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              {secondaryText}
            </button>
          </div>
          
          <p className="mt-4 text-xs text-[#8c6b3e] italic">
            Edite o texto deste bloco no painel lateral
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-[28px] p-8 md:p-12 ${bgStyle}`}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 bg-white/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="text-bible-gold" size={28} />
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold text-bible-ink dark:text-white mb-3">
          {headline}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {subheadline}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/login?redirect=/criar-conteudo')}
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95 ${primaryStyle}`}
          >
            {primaryText}
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={() => navigate('/estudos')}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
          >
            {secondaryText}
          </button>
        </div>
      </div>
    </section>
  );
};

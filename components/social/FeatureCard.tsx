"use client";
import { useNavigate } from '../../utils/router';

import React from 'react';

import { 
  Heart, Trophy, Palette, Calendar, MessageCircle, 
  ArrowRight, Sparkles, Mic2
} from 'lucide-react';

export type FeatureCardType = 'devotional' | 'quiz' | 'studio' | 'plan' | 'chat';

interface FeatureCardProps {
  type: FeatureCardType;
}

const FEATURE_CONFIG: Record<FeatureCardType, {
  icon: React.ReactNode;
  title: string;
  desc: string;
  btn: string;
  path: string;
  accent: string;
}> = {
  devotional: {
    icon: <Heart size={20} fill="currentColor" />,
    title: "Pão Diário",
    desc: "O alimento espiritual para o seu dia.",
    btn: "Meditar",
    path: "/devocional",
    accent: "text-orange-500 bg-orange-500/10"
  },
  quiz: {
    icon: <Trophy size={20} />,
    title: "Sabedoria",
    desc: "Teste seus conhecimentos bíblicos.",
    btn: "Jogar",
    path: "/quiz",
    accent: "text-yellow-500 bg-yellow-500/10"
  },
  studio: {
    icon: <Palette size={20} />,
    title: "Estúdio",
    desc: "Crie artes sacras com IA.",
    btn: "Criar",
    path: "/estudio-criativo",
    accent: "text-pink-500 bg-pink-500/10"
  },
  plan: {
    icon: <Calendar size={20} />,
    title: "Minha Meta",
    desc: "Siga seu plano de leitura diária.",
    btn: "Ler",
    path: "/plano",
    accent: "text-green-500 bg-green-500/10"
  },
  chat: {
    icon: <MessageCircle size={20} />,
    title: "Conselheiro",
    desc: "Tire dúvidas teológicas com a IA.",
    btn: "Conversar",
    path: "/chat",
    accent: "text-blue-500 bg-blue-500/10"
  }
};

const FeatureCard: React.FC<FeatureCardProps> = ({ type }) => {
  const navigate = useNavigate();
  const config = FEATURE_CONFIG[type];

  if (!config) return null;

  return (
    <div className="relative group overflow-hidden p-6 rounded-[2.5rem] bg-gray-50/40 dark:bg-bible-darkPaper/40 border border-gray-100 dark:border-gray-800 backdrop-blur-md transition-all hover:bg-white dark:hover:bg-bible-darkPaper hover:shadow-2xl hover:border-bible-gold/20 mb-8 mx-4 md:mx-0">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
        <Sparkles size={120} />
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${config.accent}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white truncate">
              {config.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {config.desc}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate(config.path)}
          className="px-5 py-2.5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          {config.btn}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default FeatureCard;
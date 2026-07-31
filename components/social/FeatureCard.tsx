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
    <div className="group relative mb-4 overflow-hidden rounded-[1.5rem] border border-[#e4ded5] bg-white p-5 shadow-[0_8px_30px_rgba(30,41,35,0.04)] transition-all hover:-translate-y-0.5 hover:border-emerald-700/20 hover:shadow-[0_16px_40px_rgba(30,41,35,0.08)] dark:border-white/10 dark:bg-[#151515]">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
        <Sparkles size={120} />
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${config.accent}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-gray-900 dark:text-white">
              {config.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {config.desc}
            </p>
          </div>
        </div>
        
        <button 
          type="button"
          onClick={() => navigate(config.path)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#082f2b] px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-emerald-900 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:w-auto"
        >
          {config.btn}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default FeatureCard;

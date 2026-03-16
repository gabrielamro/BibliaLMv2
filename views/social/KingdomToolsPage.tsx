"use client";
import { useNavigate } from '../../utils/router';


import React from 'react';

import { Palette, Brain, Trophy, Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import SocialNavigation from '../../components/SocialNavigation';
import SEO from '../../components/SEO';

const KingdomToolsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto flex flex-col relative">
      <SEO title="Ferramentas do Reino" description="Acesse o Estúdio Criativo e o Quiz da Sabedoria." />
      
      <SocialNavigation activeTab="tools" />

      <div className="flex-1 p-6 md:p-8 pb-32">
        <div className="max-w-2xl mx-auto space-y-8">
            
            <div className="text-center space-y-2 pt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-bible-gold to-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-4">
                    <Wand2 size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Ferramentas Interativas</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Recursos para expressar sua fé e testar conhecimentos.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                
                {/* Card Estúdio Criativo */}
                <div 
                    onClick={() => navigate('/estudio-criativo')}
                    className="group relative bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 p-20 bg-pink-50 dark:bg-pink-900/10 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/20 transition-colors"></div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform duration-500">
                            <Palette size={40} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Estúdio Criativo</h3>
                                <span className="bg-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Novo</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                Crie artes sacras com IA e gere podcasts automáticos baseados na Bíblia.
                            </p>
                            <span className="flex items-center gap-2 text-xs font-bold text-pink-600 group-hover:translate-x-2 transition-transform">
                                Acessar Estúdio <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Card Quiz */}
                <div 
                    onClick={() => navigate('/quiz')}
                    className="group relative bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 p-20 bg-orange-50 dark:bg-orange-900/10 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 transition-colors"></div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-500">
                            <Trophy size={40} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Desafio da Sabedoria</h3>
                                <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Ranked</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                Teste seus conhecimentos bíblicos, suba no ranking e ganhe Maná extra.
                            </p>
                            <span className="flex items-center gap-2 text-xs font-bold text-orange-600 group-hover:translate-x-2 transition-transform">
                                Jogar Agora <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default KingdomToolsPage;

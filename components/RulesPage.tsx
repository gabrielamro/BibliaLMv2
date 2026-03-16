"use client";
import { useNavigate } from '../utils/router';

import React from 'react';

import { ArrowLeft, Sparkles, Award, Shield, Zap, BookOpen, Coffee, Brain, Crown } from 'lucide-react';
import { BADGES } from '../constants';

const RulesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold">
              Jornada e Recompensas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Entenda como evoluir e os limites de uso.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Card Maná */}
            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Maná (XP)</h2>
                        <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">Sua Vitalidade</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    O Maná representa sua constância espiritual. Ele não é gasto, apenas acumulado para subir de nível e desbloquear novos selos e medalhas no seu perfil.
                </p>
                <div className="space-y-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                    <div className="flex justify-between"><span>Leitura de Capítulo</span> <span className="text-green-600 font-bold">+20 Maná</span></div>
                    <div className="flex justify-between"><span>Meta Diária Concluída</span> <span className="text-green-600 font-bold">+50 Maná</span></div>
                    <div className="flex justify-between"><span>Criar Esboço de Sermão</span> <span className="text-green-600 font-bold">+40 Maná</span></div>
                </div>
            </div>

            {/* Card Limites Diários */}
            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Limites Diários</h2>
                        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Uso por Plano</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    As funcionalidades de Inteligência Artificial (Artes, Podcasts e Análises) possuem limites de uso que se renovam a cada 24 horas, variando conforme seu plano.
                </p>
                <div className="space-y-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                    <div className="flex justify-between"><span>Plano Visitante</span> <span className="text-orange-600 font-bold">Uso Degustação</span></div>
                    <div className="flex justify-between"><span>Plano Semeador</span> <span className="text-orange-600 font-bold">10 Imagens/dia</span></div>
                    <div className="flex justify-between"><span>Plano Visionário (Gold)</span> <span className="text-orange-600 font-bold">ILIMITADO</span></div>
                </div>
            </div>
        </div>

        {/* Galeria de Selos */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-bible-leather dark:text-bible-gold mb-6 flex items-center gap-2">
                <Award size={24} /> Galeria de Conquistas
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BADGES.map((badge) => (
                    <div key={badge.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold/30 transition-colors">
                        <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl ${badge.color} bg-opacity-20`}>
                            {badge.icon}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{badge.name}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1 block">
                                {badge.category === 'supporter' ? 'Selo de Apoio' : badge.category === 'level' ? 'Nível' : 'Conquista'}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                {badge.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default RulesPage;

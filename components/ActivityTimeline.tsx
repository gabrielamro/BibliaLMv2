"use client";


import React, { useMemo } from 'react';
import { 
  BookOpen, Coffee, Image as ImageIcon, Mic2, 
  MessageCircle, Heart, Share2, PenTool, Trophy, 
  Calendar, CheckCircle2, Zap, Users, Brain, Crown,
  History
} from 'lucide-react';
import { UserActivity, ActionType } from '../types';

interface ActivityTimelineProps {
  activities: UserActivity[];
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, bg: string }> = {
  'reading_chapter': { icon: <BookOpen size={16} />, label: 'Leitura Bíblica', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'daily_goal': { icon: <CheckCircle2 size={16} />, label: 'Meta Diária', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  'devotional': { icon: <Coffee size={16} />, label: 'Pão Diário', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  'deep_study': { icon: <Brain size={16} />, label: 'Estudo Profundo', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  'create_image': { icon: <ImageIcon size={16} />, label: 'Arte Sacra', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  'share_content': { icon: <Share2 size={16} />, label: 'Compartilhamento', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  'mark_verse': { icon: <PenTool size={16} />, label: 'Marcação', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  'create_sermon': { icon: <Mic2 size={16} />, label: 'Sermão Criado', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'use_chat': { icon: <MessageCircle size={16} />, label: 'Conselho IA', color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  'quiz_completion': { icon: <Trophy size={16} />, label: 'Desafio Sabedoria', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  'social_follow': { icon: <Users size={16} />, label: 'Conexão', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'prayer_wall': { icon: <Heart size={16} />, label: 'Oração', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  'create_note': { icon: <PenTool size={16} />, label: 'Anotação', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  'social_like': { icon: <Heart size={16} />, label: 'Interação', color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  'start_module': { icon: <Crown size={16} />, label: 'Início de Trilha', color: 'text-bible-gold', bg: 'bg-bible-gold/20' },
  'join_plan': { icon: <Calendar size={16} />, label: 'Nova Jornada', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  
  const groupedActivities = useMemo(() => {
    const groups: Record<string, UserActivity[]> = {
        'Hoje': [],
        'Ontem': [],
        'Esta Semana': [],
        'Anteriormente': []
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    activities.forEach(act => {
        const date = new Date(act.timestamp);
        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (isToday) groups['Hoje'].push(act);
        else if (isYesterday) groups['Ontem'].push(act);
        else if (diffDays <= 7) groups['Esta Semana'].push(act);
        else groups['Anteriormente'].push(act);
    });

    return groups;
  }, [activities]);

  const hasActivities = activities.length > 0;

  return (
    <div className="relative pl-4 space-y-8">
      {/* Linha Vertical Conectora */}
      {hasActivities && (
          <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 -z-10"></div>
      )}

      {/* Fixed: Casting entries result to explicitly define UserActivity[] for items mapping */}
      {(Object.entries(groupedActivities) as [string, UserActivity[]][]).map(([label, groupItems]) => {
          if (groupItems.length === 0) return null;

          return (
              <div key={label} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 bg-gray-50 dark:bg-black/40 w-fit px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                      {label}
                  </h3>
                  
                  <div className="space-y-6">
                      {groupItems.map((item) => {
                          const config = ACTION_CONFIG[item.type] || { 
                              icon: <Zap size={16} />, 
                              label: 'Atividade', 
                              color: 'text-gray-500', 
                              bg: 'bg-gray-100' 
                          };

                          return (
                              <div key={item.id} className="relative flex items-start gap-4 group">
                                  {/* Dot no Timeline */}
                                  <div className={`absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-black ${config.bg.replace('/30','')} ring-2 ring-gray-100 dark:ring-gray-800`}></div>
                                  
                                  <div className="flex-1 bg-white dark:bg-bible-darkPaper p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-bible-gold/30">
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center gap-2">
                                              <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                                                  {config.icon}
                                              </div>
                                              <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                                                  {config.label}
                                              </span>
                                          </div>
                                          <span className="text-[10px] font-medium text-gray-400">
                                              {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                      </div>
                                      
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                                          {item.description}
                                      </p>
                                      
                                      {item.meta?.xpGained && (
                                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 w-fit px-2 py-0.5 rounded-full">
                                              <Zap size={10} fill="currentColor" /> +{item.meta.xpGained} Maná
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          );
      })}

      {!hasActivities && (
          <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <History size={32} />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma atividade registrada ainda.</p>
              <p className="text-xs text-gray-400">Suas leituras e estudos aparecerão aqui.</p>
          </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect } from 'react';

import { dbService } from '../services/supabase';
import { CustomPlan, PlanParticipant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { Loader2, BookOpen, GraduationCap, Layout, Clock, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import StandardCard from '../components/ui/StandardCard';
import SEO from '../components/SEO';

interface PlanWithProgress extends CustomPlan {
    userProgress: number;
    isCompleted: boolean;
}

const StudentWorkspacePage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { setTitle, setIcon, resetHeader } = useHeader();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'catalog' | 'active' | 'history'>('catalog');
  const [plans, setPlans] = useState<(CustomPlan | PlanWithProgress)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle('Área do Aluno');
    setIcon(<GraduationCap size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  useEffect(() => {
      const loadPlans = async () => {
          setLoading(true);
          try {
              if (activeTab === 'catalog') {
                  const publicPlans = await dbService.getPublicPlans();
                  setPlans(publicPlans);
              } else if ((activeTab === 'active' || activeTab === 'history') && currentUser) {
                  // 1. Get Enrolled IDs
                  const enrolledIds = userProfile?.enrolledPlans || [];
                  
                  if (enrolledIds.length > 0) {
                     // 2. Fetch Plans Data
                     const myPlans = await dbService.getEnrolledPlans(enrolledIds);
                     
                     // 3. Calculate Progress for each plan
                     const plansWithProgress: PlanWithProgress[] = await Promise.all(myPlans.map(async (p) => {
                         const participant = await dbService.getPlanParticipant(p.id, currentUser.uid);
                         
                         let totalSteps = 0;
                         p.weeks.forEach(w => totalSteps += w.days.length);
                         
                         const completedCount = participant?.completedSteps?.length || 0;
                         const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
                         
                         return {
                             ...p,
                             userProgress: progress,
                             isCompleted: progress >= 100
                         };
                     }));

                     // 4. Filter based on Tab
                     if (activeTab === 'active') {
                         setPlans(plansWithProgress.filter(p => !p.isCompleted));
                     } else {
                         setPlans(plansWithProgress.filter(p => p.isCompleted));
                     }
                  } else {
                     setPlans([]);
                  }
              } else {
                  setPlans([]);
              }
          } catch (e) {
              console.error(e);
          } finally {
              setLoading(false);
          }
      };
      loadPlans();
  }, [activeTab, currentUser, userProfile]);

  const getFrequencyLabel = (freq: string) => {
      switch(freq) {
          case 'daily': return 'Diário';
          case 'weekly': return 'Semanal';
          case 'monthly': return 'Mensal';
          default: return 'Livre';
      }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="Área do Aluno" />
        
        <div className="max-w-6xl mx-auto pb-32">
            
            <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 mb-8 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('catalog')} 
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'catalog' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Globe size={14}/> Catálogo
                </button>
                <button 
                    onClick={() => setActiveTab('active')} 
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'active' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <BookOpen size={14}/> Em Andamento
                </button>
                 <button 
                    onClick={() => setActiveTab('history')} 
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'history' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <CheckCircle2 size={14}/> Histórico
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Layout size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold mb-4">
                        {activeTab === 'active' ? 'Nenhuma sala em andamento.' : activeTab === 'history' ? 'Nenhum curso concluído.' : 'Nenhuma sala pública disponível.'}
                    </p>
                    {activeTab !== 'catalog' && (
                        <button onClick={() => setActiveTab('catalog')} className="bg-bible-gold text-white px-6 py-2 rounded-xl text-xs font-bold">
                            Explorar Salas Públicas
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {plans.map(plan => (
                        <StandardCard
                            key={plan.id}
                            title={plan.title}
                            subtitle={plan.description}
                            imageUrl={plan.coverUrl}
                            author={plan.authorName}
                            badges={[
                                { label: plan.category, color: 'bg-purple-100 text-purple-600' },
                                { label: getFrequencyLabel(plan.planningFrequency), color: 'bg-blue-100 text-blue-600' }
                            ]}
                            metrics={activeTab === 'catalog' ? plan.metrics : undefined}
                            progress={('userProgress' in plan) ? (plan as PlanWithProgress).userProgress : undefined}
                            actionLabel={activeTab === 'catalog' ? 'Ver Detalhes' : 'Continuar'}
                            onAction={() => navigate(`/jornada/${plan.id}`)}
                            onClick={() => navigate(`/jornada/${plan.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default StudentWorkspacePage;
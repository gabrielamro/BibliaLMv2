"use client";
import { useNavigate } from '../utils/router';


import React from 'react';

import { ArrowLeft, History, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ActivityTimeline from '../components/ActivityTimeline';
import SEO from '../components/SEO';

const TimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-4 md:p-8">
        <SEO title="Minhas Atividades" />
        
        <div className="max-w-2xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 shadow-sm transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="text-bible-gold" /> Minhas Atividades
                    </h1>
                    <p className="text-sm text-gray-500">O rastro da sua caminhada espiritual.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                <ActivityTimeline activities={userProfile?.activityLog || []} />
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest font-bold opacity-50">
                Fim do Histórico Recente
            </div>
        </div>
    </div>
  );
};

export default TimelinePage;

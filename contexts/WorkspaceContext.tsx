"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { dbService, supabase } from '../services/supabase';
import { CustomPlan, PlanTeam, CustomQuiz } from '../types';

interface WorkspaceContextProps {
  plans: CustomPlan[];
  teams: PlanTeam[];
  quizzes: CustomQuiz[];
  tracks: any[];
  prayers: any[];
  loading: boolean;
  isPastor: boolean;

  refreshWorkspace: () => Promise<void>;
  createTeam: (name: string, color: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  saveQuiz: (quizData: any) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, showNotification } = useAuth();
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [teams, setTeams] = useState<PlanTeam[]>([]);
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isPastor = userProfile?.subscriptionTier === 'pastor' || userProfile?.subscriptionTier === 'admin';

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const uid = currentUser.id ?? currentUser.uid;
      const pData = await dbService.getUserCustomPlans(uid);
      setPlans(pData);

      if (isPastor) {
        // Feature Trilhas DESATIVADA
        const [tData, qData, prData] = await Promise.all([
          dbService.getGlobalTeams(uid),
          dbService.getCustomQuizzes(uid),
          // dbService.getTracks(uid), // DESATIVADO
          dbService.getPastorPrayers(uid),
        ]);
        setTeams(tData);
        setQuizzes(qData);
        setTracks([]); // Resetado como vazio enquanto desativado
        setPrayers(prData);
      }
    } catch (e) {
      console.error(e);
      showNotification("Erro ao carregar dados do workspace.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isPastor]);

  const createTeam = async (name: string, color: string) => {
    if (!name.trim() || !currentUser) return;
    const uid = currentUser.id ?? currentUser.uid;
    try {
      const ref = await dbService.createTeam(uid, { name, color, members: [] });
      setTeams(prev => [...prev, { id: ref.id, name, color, members: [] }]);
      showNotification("Equipe criada com sucesso!", "success");
    } catch (e) {
      showNotification("Erro ao criar equipe.", "error");
      throw e;
    }
  };

  const deleteTeam = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.id ?? currentUser.uid;
    try {
      await dbService.deleteTeam(uid, id);
      setTeams(prev => prev.filter(t => t.id !== id));
      showNotification("Equipe removida.", "info");
    } catch (e) {
      showNotification("Erro ao remover equipe.", "error");
      throw e;
    }
  };

  const saveQuiz = async (quizData: Omit<CustomQuiz, 'id' | 'authorId' | 'isActive' | 'createdAt'>) => {
    if (!currentUser) return;
    const uid = currentUser.id ?? currentUser.uid;
    try {
      const finalData = {
        author_id: uid,
        title: (quizData as any).title,
        description: (quizData as any).description ?? null,
        category: (quizData as any).category ?? 'Geral',
        questions: JSON.stringify((quizData as any).questions ?? []),
        game_mode: (quizData as any).gameMode ?? 'individual',
        ai_config: (quizData as any).aiConfig ? JSON.stringify((quizData as any).aiConfig) : null,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data: res, error } = await supabase
        .from('custom_quizzes')
        .insert(finalData)
        .select()
        .single();

      if (error) throw error;

      const newQuiz = { id: res.id, authorId: uid, isActive: true, createdAt: res.created_at, ...quizData } as CustomQuiz;
      setQuizzes(prev => [...prev, newQuiz]);
      showNotification("Quiz criado com sucesso!", "success");
    } catch (e) {
      showNotification("Erro ao salvar quiz.", "error");
      throw e;
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('custom_quizzes').delete().eq('id', id);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== id));
      showNotification("Quiz excluído.", "info");
    } catch (e) {
      showNotification("Erro ao excluir quiz.", "error");
      throw e;
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      plans, teams, quizzes, tracks, prayers, loading, isPastor,
      refreshWorkspace: fetchData,
      createTeam, deleteTeam, saveQuiz, deleteQuiz
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

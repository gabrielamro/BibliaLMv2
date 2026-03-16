"use client";
import { useNavigate } from '../utils/router';


import React, { useState, useEffect, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { PlanProgress, StudyTask } from '../types';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Sun,
  Loader2,
  CalendarCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  Activity
} from 'lucide-react';
import SEO from '../components/SEO';

const DAYS_OF_WEEK = [
    { label: 'SEG', full: 'Segunda-feira', id: 1 },
    { label: 'TER', full: 'Terça-feira', id: 2 },
    { label: 'QUA', full: 'Quarta-feira', id: 3 },
    { label: 'QUI', full: 'Quinta-feira', id: 4 },
    { label: 'SEX', full: 'Sexta-feira', id: 5 },
    { label: 'SÁB', full: 'Sábado', id: 6 },
    { label: 'DOM', full: 'Domingo', id: 0 },
];

const DEFAULT_TASKS: Record<number, string[]> = {
    1: ['Oração Matinal', 'Leitura do Plano', 'Anotar 1 Insight'],
    2: ['Oração Matinal', 'Leitura do Plano', 'Ouvir Podcast Bíblico'],
    3: ['Oração Matinal', 'Leitura do Plano', 'Interceder por Alguém'],
    4: ['Oração Matinal', 'Leitura do Plano', 'Meditar em 1 Versículo'],
    5: ['Oração Matinal', 'Leitura do Plano', 'Gratidão do Dia'],
    6: ['Revisão da Semana', 'Estudo IA Profundo', 'Preparar para o Culto'],
    0: ['Culto Presencial/Online', 'Anotar Sermão', 'Oração em Família'],
};

const RoutinePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setTitle, setIcon, resetHeader } = useHeader();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  
  // Define o dia atual como padrão inicial (0-6)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    setTitle('Hábitos Diários');
    setIcon(<Activity size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  useEffect(() => {
    const init = async () => {
      if (currentUser) {
        try {
          const stored = await dbService.getUserProfile(currentUser.uid);
          if (stored && stored.readingPlan) {
             let currentPlan = { ...stored.readingPlan };
             
             // Inicialização de Rotinas Diárias se não existirem
             if (!currentPlan.dailyRoutines) {
                const routines: { [key: number]: StudyTask[] } = {};
                [1, 2, 3, 4, 5, 6, 0].forEach(day => {
                    routines[day] = DEFAULT_TASKS[day].map((label, i) => ({
                        id: `${day}-${Date.now()}-${i}`,
                        label,
                        isCompleted: false
                    }));
                });
                currentPlan.dailyRoutines = routines;
                // Salva a inicialização no banco
                await dbService.updateUserProfile(currentUser.uid, { readingPlan: currentPlan });
             }
             
             setProgress(currentPlan);
          }
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    };
    init();
  }, [currentUser]);

  const currentRoutine = useMemo(() => {
      return progress?.dailyRoutines?.[selectedDay] || [];
  }, [progress, selectedDay]);

  const updateRoutine = async (newTasks: StudyTask[]) => {
      if (!currentUser || !progress) return;
      const updatedRoutines = { 
          ...(progress.dailyRoutines || {}), 
          [selectedDay]: newTasks 
      };
      const updatedPlan = { ...progress, dailyRoutines: updatedRoutines };
      setProgress(updatedPlan);
      await dbService.updateUserProfile(currentUser.uid, { readingPlan: updatedPlan });
  };

  const handleToggleTask = async (taskId: string) => {
      const newTasks = currentRoutine.map(t => 
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      await updateRoutine(newTasks);
  };

  const handleDeleteTask = async (taskId: string) => {
      const newTasks = currentRoutine.filter(t => t.id !== taskId);
      await updateRoutine(newTasks);
  };

  const handleAddTask = async () => {
      if (!newTaskLabel.trim() || !progress) return;
      const newTask: StudyTask = {
        id: `custom-${Date.now()}`,
        label: newTaskLabel,
        isCompleted: false
      };
      const newTasks = [...currentRoutine, newTask];
      await updateRoutine(newTasks);
      setNewTaskLabel('');
  };

  const completionPercentage = currentRoutine.length > 0 
    ? Math.round((currentRoutine.filter(t => t.isCompleted).length / currentRoutine.length) * 100) 
    : 0;

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-bible-gold" /></div>;

  const activeDayFull = DAYS_OF_WEEK.find(d => d.id === selectedDay)?.full;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="Minha Rotina" />
        
        <div className="max-w-xl mx-auto pb-24">
            {/* Day Selector Tabs */}
            <div className="flex justify-between gap-1 mb-8 bg-white dark:bg-bible-darkPaper p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar">
                {DAYS_OF_WEEK.sort((a,b) => {
                    // Ordena começando por Segunda (id 1)
                    const sortOrder = [1, 2, 3, 4, 5, 6, 0];
                    return sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id);
                }).map((day) => (
                    <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`flex-1 min-w-[50px] py-3 rounded-xl text-[10px] font-black transition-all ${
                            selectedDay === day.id 
                            ? 'bg-bible-gold text-white shadow-md scale-[1.05]' 
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            {/* Main Day Card */}
            <div className="bg-gradient-to-br from-bible-leather to-[#3d2b25] dark:from-bible-darkPaper dark:to-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl mb-8 border border-white/5">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Clock size={120} /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                        <Sparkles size={14} className="text-bible-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{activeDayFull}</span>
                    </div>
                    <h2 className="text-3xl font-serif font-bold mb-4">{completionPercentage}% <span className="text-lg opacity-60 font-sans">Concluído</span></h2>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-bible-gold h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Checklist Header */}
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarCheck size={14} /> Tarefas do Dia
                </h3>
                <span className="text-[10px] font-bold text-bible-gold bg-bible-gold/10 px-2 py-1 rounded-full">
                    {currentRoutine.filter(t => t.isCompleted).length}/{currentRoutine.length}
                </span>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
                {currentRoutine.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-bible-darkPaper rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <Info size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400 font-medium">Nenhuma tarefa para este dia.</p>
                    </div>
                ) : (
                    currentRoutine.map((task) => (
                        <div 
                            key={task.id} 
                            onClick={() => handleToggleTask(task.id)}
                            className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                task.isCompleted 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' 
                                : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 hover:border-bible-gold/30'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    task.isCompleted 
                                    ? 'bg-green-500 text-white scale-110' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-transparent'
                                }`}>
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className={`text-base font-bold transition-colors ${
                                    task.isCompleted 
                                    ? 'text-green-800 dark:text-green-200 line-through decoration-green-500/50' 
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}>
                                    {task.label}
                                </span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}

                {/* Add New Task Field */}
                <div className="bg-white dark:bg-bible-darkPaper p-2 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center gap-2 mt-6 focus-within:border-bible-gold transition-colors">
                    <input 
                        type="text" 
                        value={newTaskLabel}
                        onChange={(e) => setNewTaskLabel(e.target.value)}
                        placeholder={`Novo hábito para ${activeDayFull?.split('-')[0]}...`}
                        className="flex-1 bg-transparent p-3 outline-none text-sm font-medium text-gray-700 dark:text-gray-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <button 
                        onClick={handleAddTask}
                        disabled={!newTaskLabel.trim()}
                        className="bg-bible-gold text-white p-3 rounded-xl hover:bg-yellow-600 disabled:opacity-30 transition-all active:scale-95 shadow-md"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400"><Info size={20} /></div>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>Dica do Reino:</strong> Mantenha sua rotina atualizada. Concluir todas as tarefas diárias ajuda você a manter a constância (Streak) e ganhar mais Maná!
                </p>
            </div>

        </div>
    </div>
  );
};

export default RoutinePage;

"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';
import { CalendarRange, CheckCircle2, Circle, Settings, Bell, BellOff, BookOpen, ChevronRight, ChevronLeft, Lock, Smile, Frown, Meh, Heart, Sunrise, Sunset, Loader2, Save, PenTool, Calendar as CalendarIcon, AlertTriangle, PlayCircle, Thermometer, ListFilter, ListTodo, Plus, Trash2, GripVertical, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { dbService } from '../services/supabase';
import { PlanProgress, DailyReading, PlanScope } from '../types';
import { getReadingForDay } from '../services/readingPlanService';
import ReadingPlanOnboarding from './ReadingPlanOnboarding';
import ConfirmationModal from './ConfirmationModal';

const ReadingPlanDashboard: React.FC = () => {
  const { currentUser, openLogin, userProfile, showNotification } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'routine' | 'settings'>('progress');
  
  // Local state for the plan settings
  const [planSettings, setPlanSettings] = useState<PlanProgress>({
    isActive: false, 
    planType: '365',
    planScope: 'all', 
    completedDays: [], 
    completedSections: {},
    lastChapterInSection: {},
    lastReadingDate: '',
    streak: 0,
    startDate: '', 
    notificationsEnabled: false,
    notificationTime: '08:00',
    studyRoutine: []
  });
  
  const [viewDay, setViewDay] = useState(1);
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const lastNotificationSent = useRef<string>('');

  useEffect(() => {
    if (userProfile?.readingPlan) {
        setPlanSettings({ ...planSettings, ...userProfile.readingPlan });
    }
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
      if (planSettings.isActive && planSettings.startDate) {
          const start = new Date(planSettings.startDate);
          const now = new Date();
          const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); 
          
          if (viewDay === 1 && diffDays > 1) setViewDay(diffDays);
          
          setDailyReading(getReadingForDay(viewDay, '365', planSettings.startDate, planSettings.planScope));
      }
  }, [viewDay, planSettings.startDate, planSettings.isActive, planSettings.planScope]);

  // --- LÓGICA DE NOTIFICAÇÃO ---
  useEffect(() => {
    if (!planSettings.notificationsEnabled || !planSettings.notificationTime) return;

    const checkTime = () => {
        const now = new Date();
        const currentTimeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Verifica se é a hora exata e se já não enviamos hoje (para evitar spam no mesmo minuto)
        if (currentTimeString === planSettings.notificationTime && lastNotificationSent.current !== currentTimeString) {
            
            lastNotificationSent.current = currentTimeString;

            if (Notification.permission === 'granted') {
                new Notification("BíbliaLM - Hora da Leitura", {
                    body: `O plano de leitura do Dia ${viewDay} está te esperando. Vamos edificar o espírito?`,
                    icon: "/icon.png", // Certifique-se que existe ou remova
                    badge: "/icon.png"
                });
            }
        }
    };

    const interval = setInterval(checkTime, 10000); // Checa a cada 10s
    return () => clearInterval(interval);
  }, [planSettings.notificationsEnabled, planSettings.notificationTime, viewDay]);

  const handleStartPlan = async (startToday: boolean, scope: PlanScope) => {
      if (!currentUser) { openLogin(); return; }
      const startDate = new Date().toISOString();
      const newPlan: PlanProgress = { 
          ...planSettings, 
          isActive: true, 
          planScope: scope, 
          startDate: startDate, 
          completedDays: [], 
          completedSections: {}, 
          lastChapterInSection: {}, 
          streak: 0 
      };
      setPlanSettings(newPlan);
      await dbService.updateUserProfile(currentUser.uid, { readingPlan: newPlan });
  };

  const handleUpdateSettings = async (updates: Partial<PlanProgress>) => {
      if (!currentUser) return;
      
      // Se estiver tentando ativar notificações
      if (updates.notificationsEnabled === true) {
          if (!('Notification' in window)) {
              showNotification("Este navegador não suporta notificações.", "error");
              return;
          }
          
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
              showNotification("Permissão de notificação negada no navegador.", "warning");
              return; // Não salva o estado como true
          }
          
          // Teste imediato
          new Notification("Notificações Ativadas", { body: "Você receberá lembretes neste dispositivo." });
      }

      const newPlan = { ...planSettings, ...updates };
      setPlanSettings(newPlan);
      await dbService.updateUserProfile(currentUser.uid, { readingPlan: newPlan });
  };

  const handleResetPlan = async () => {
      setResetModalOpen(false);
      const resetPlan = { ...planSettings, isActive: false, startDate: '' };
      setPlanSettings(resetPlan);
      if (currentUser) await dbService.updateUserProfile(currentUser.uid, { readingPlan: resetPlan });
  };

  const handleStartReading = (sectionIndex: number = 0) => {
    if (dailyReading) {
      navigate('/plano/leitura', {
        state: { dailyReading, planProgress: planSettings, initialSectionIdx: sectionIndex } 
      });
    }
  };

  const checkDayCompletion = (reading: DailyReading) => {
      if (!userProfile?.progress?.readChapters) return false;
      
      const allRead = reading.readings.every(r => {
          const chaptersRange = Array.from({length: r.endChapter - r.startChapter + 1}, (_, i) => r.startChapter + i);
          const userReadChapters = userProfile.progress!.readChapters[r.bookId] || [];
          return chaptersRange.every(c => userReadChapters.includes(c));
      });
      return allRead;
  };

  if (loading) return <div className="p-10 flex justify-center h-full items-center"><Loader2 className="animate-spin text-bible-gold" /></div>;
  if (!planSettings.isActive) return <ReadingPlanOnboarding onStart={handleStartPlan} />;

  const isDayComplete = dailyReading ? checkDayCompletion(dailyReading) : false;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-bible-darkPaper rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          
          <div className="flex items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2 flex-1">
                  {[{ id: 'progress', label: 'Leitura', icon: <BookOpen size={14}/> }, { id: 'routine', label: 'Rotina', icon: <ListTodo size={14}/> }, { id: 'settings', label: 'Ajustes', icon: <Settings size={14}/> }].map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-bible-gold text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>{tab.icon} {tab.label}</button>
                  ))}
              </div>
              
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">{planSettings.planScope === 'all' ? 'Bíblia Completa' : 'Novo Testamento'}</span>
                  <button onClick={() => setResetModalOpen(true)} className="p-2 hover:text-red-500 text-gray-400 transition-colors" title="Reiniciar Plano"><RotateCcw size={18} /></button>
              </div>
          </div>

          {activeTab === 'progress' && (
              <div className="animate-in fade-in">
                  <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl">
                      <button onClick={() => setViewDay(v => Math.max(1, v-1))} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-all"><ChevronLeft size={20}/></button>
                      <div className="flex flex-col items-center">
                          <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Dia {viewDay}</p>
                          <span className="text-[10px] text-gray-400 font-bold">{dailyReading?.dateDisplay}</span>
                      </div>
                      <button onClick={() => setViewDay(v => Math.min(365, v+1))} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-all"><ChevronRight size={20}/></button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      {dailyReading?.readings.map((r, i) => {
                          const chaptersRange = Array.from({length: r.endChapter - r.startChapter + 1}, (_, idx) => r.startChapter + idx);
                          const userRead = userProfile?.progress?.readChapters?.[r.bookId] || [];
                          const isSectionComplete = chaptersRange.every(c => userRead.includes(c));

                          return (
                              <div key={i} onClick={() => handleStartReading(i)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isSectionComplete ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 hover:border-bible-gold'}`}>
                                  <div>
                                      <p className="text-[10px] font-black text-bible-gold uppercase tracking-widest mb-1">{r.section}</p>
                                      <p className="text-lg font-serif font-bold text-gray-900 dark:text-white">{r.ref}</p>
                                  </div>
                                  {isSectionComplete ? <CheckCircle2 size={24} className="text-green-500" /> : <ChevronRight size={20} className="text-gray-300" />}
                              </div>
                          );
                      })}
                  </div>

                  {isDayComplete && (
                      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2">
                          <CheckCircle2 size={20} /> Meta do Dia Concluída!
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'routine' && (
              <div className="text-center py-10 animate-in fade-in">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                    <ListTodo size={32} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Minha Rotina Diária</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Gerencie seus hábitos espirituais e acompanhe sua disciplina diária.</p>
                  <button onClick={() => navigate('/rotina')} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                      Abrir Checklist
                  </button>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Bell size={20} className="text-bible-gold" /> Configurar Lembretes
                      </h3>
                      
                      <div className="flex items-center justify-between mb-6">
                          <div>
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Ativar Notificações</p>
                              <p className="text-xs text-gray-500">Receba lembretes para ler.</p>
                          </div>
                          <button 
                              onClick={() => handleUpdateSettings({ notificationsEnabled: !planSettings.notificationsEnabled })}
                              className={`w-12 h-7 rounded-full transition-colors relative ${planSettings.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${planSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                      </div>

                      <div className={`transition-opacity ${planSettings.notificationsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Horário do Lembrete</label>
                          <input 
                              type="time" 
                              value={planSettings.notificationTime || '08:00'} 
                              onChange={(e) => handleUpdateSettings({ notificationTime: e.target.value })}
                              className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bible-gold font-bold"
                          />
                      </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30">
                      <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                          <AlertTriangle size={20} /> Zona de Perigo
                      </h3>
                      <p className="text-xs text-red-600 dark:text-red-300 mb-6 leading-relaxed">
                          Deseja cancelar seu plano atual? Todo o progresso de dias e streak será resetado. O histórico de capítulos lidos na Bíblia será mantido.
                      </p>
                      <button 
                          onClick={() => setResetModalOpen(true)} 
                          className="w-full py-3 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                      >
                          Reiniciar Plano
                      </button>
                  </div>
              </div>
          )}
        </div>
        
        <ConfirmationModal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} onConfirm={handleResetPlan} title="Reiniciar Plano?" message="Isso apagará suas configurações de data, mas seu progresso de leitura nos livros será mantido no histórico global." confirmText="Sim, Reiniciar" variant="danger" />
      </div>
    </div>
  );
};

export default ReadingPlanDashboard;
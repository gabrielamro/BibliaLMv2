"use client";
import { useNavigate } from '../utils/router';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Gift,
  ListTodo,
  Loader2,
  Mountain,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  TimerReset,
  Target,
  TrendingUp,
  Trophy,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { dbService } from '../services/supabase';
import { DailyReading, PlanProgress, PlanScope } from '../types';
import { getReadingForDay } from '../services/readingPlanService';
import { buildReadingPlanUrl } from '../utils/readingPlanRoute';
import { getReadingPlanProgressSummary } from '../utils/readingPlanProgress';
import ReadingPlanOnboarding from './ReadingPlanOnboarding';
import ConfirmationModal from './ConfirmationModal';

const defaultPlanSettings: PlanProgress = {
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
  studyRoutine: [],
};

const scopeLabel: Record<PlanScope, string> = {
  all: 'Biblia Completa',
  new_testament: 'Novo Testamento',
  old_testament: 'Antigo Testamento',
};

const calendarClass = (status: string) => {
  if (status === 'done') return 'bg-green-500 text-white border-green-500';
  if (status === 'partial') return 'bg-bible-gold text-white border-bible-gold';
  if (status === 'missed') return 'bg-red-50 text-red-500 border-red-100 dark:bg-red-900/10 dark:border-red-900/30';
  return 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-900 dark:border-gray-800';
};

const getSectionVisual = (section: string) => {
  const normalized = section.toLowerCase();
  if (normalized.includes('sabedoria') || normalized.includes('prov')) {
    return { icon: <Sparkles size={18} />, tone: 'text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-900/30' };
  }
  if (normalized.includes('salmo') || normalized.includes('devocional')) {
    return { icon: <Sprout size={18} />, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/30' };
  }
  if (normalized.includes('antigo')) {
    return { icon: <Mountain size={18} />, tone: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-900/30' };
  }
  return { icon: <ScrollText size={18} />, tone: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-900/30' };
};

const formatPresenceMinutes = (minutes: number) => {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
};

const ReadingPlanDashboard: React.FC = () => {
  const { currentUser, openLogin, userProfile, showNotification, systemSettings } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'routine' | 'settings'>('progress');
  const [planSettings, setPlanSettings] = useState<PlanProgress>(defaultPlanSettings);
  const [viewDay, setViewDay] = useState(1);
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const lastNotificationSent = useRef<string>('');

  useEffect(() => {
    if (userProfile?.readingPlan) {
      setPlanSettings((current) => ({ ...current, ...userProfile.readingPlan }));
    }
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
    if (!planSettings.isActive || !planSettings.startDate) return;

    const start = new Date(planSettings.startDate);
    const now = new Date();
    const diffDays = Math.max(1, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000) + 1);

    if (viewDay === 1 && diffDays > 1) setViewDay(diffDays);
    setDailyReading(getReadingForDay(viewDay, planSettings.planType, planSettings.startDate, planSettings.planScope));
  }, [viewDay, planSettings.startDate, planSettings.isActive, planSettings.planScope, planSettings.planType]);

  useEffect(() => {
    if (!planSettings.notificationsEnabled || !planSettings.notificationTime) return;

    const checkTime = () => {
      const now = new Date();
      const currentTimeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (currentTimeString === planSettings.notificationTime && lastNotificationSent.current !== currentTimeString) {
        lastNotificationSent.current = currentTimeString;

        if (Notification.permission === 'granted') {
          new Notification('BibliaLM - Hora da Leitura', {
            body: `O plano de leitura do Dia ${viewDay} esta te esperando.`,
            icon: '/icon.png',
            badge: '/icon.png',
          });
        }
      }
    };

    const interval = setInterval(checkTime, 10000);
    return () => clearInterval(interval);
  }, [planSettings.notificationsEnabled, planSettings.notificationTime, viewDay]);

  const handleStartPlan = async (_startToday: boolean, scope: PlanScope) => {
    if (!currentUser) {
      openLogin();
      return;
    }

    const startDate = new Date().toISOString();
    const newPlan: PlanProgress = {
      ...planSettings,
      isActive: true,
      planScope: scope,
      startDate,
      completedDays: [],
      completedSections: {},
      lastChapterInSection: {},
      streak: 0,
    };

    setPlanSettings(newPlan);
    await dbService.updateUserProfile(currentUser.uid, { readingPlan: newPlan });
  };

  const handleUpdateSettings = async (updates: Partial<PlanProgress>) => {
    if (!currentUser) return;

    if (updates.notificationsEnabled === true) {
      if (!('Notification' in window)) {
        showNotification('Este navegador nao suporta notificacoes.', 'error');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showNotification('Permissao de notificacao negada no navegador.', 'warning');
        return;
      }

      new Notification('Notificacoes Ativadas', { body: 'Voce recebera lembretes neste dispositivo.' });
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
    if (!dailyReading) return;

    const readerUrl = buildReadingPlanUrl({
      day: dailyReading.day,
      sectionIndex,
      scope: planSettings.planScope,
      planType: planSettings.planType,
      startDate: planSettings.startDate,
    });

    navigate(readerUrl, {
      state: { dailyReading, planProgress: planSettings, initialSectionIdx: sectionIndex },
    });
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/navegar');
  };

  const checkDayCompletion = (reading: DailyReading) => {
    if ((planSettings.completedSections?.[reading.day] || []).length >= reading.readings.length) return true;
    if (!userProfile?.progress?.readChapters) return false;

    return reading.readings.every((section) => {
      const chaptersRange = Array.from({ length: section.endChapter - section.startChapter + 1 }, (_, i) => section.startChapter + i);
      const userReadChapters = userProfile.progress!.readChapters[section.bookId] || [];
      return chaptersRange.every((chapter) => userReadChapters.includes(chapter));
    });
  };

  if (loading) return <div className="p-10 flex justify-center h-full items-center"><Loader2 className="animate-spin text-bible-gold" /></div>;
  if (!planSettings.isActive) return <ReadingPlanOnboarding onStart={handleStartPlan} />;

  const progressSummary = getReadingPlanProgressSummary({
    reading: dailyReading,
    progress: planSettings,
    readChapters: userProfile?.progress?.readChapters,
    xpReadingChapter: systemSettings?.gamification?.xpReadingChapter ?? 20,
    xpDailyGoal: systemSettings?.gamification?.xpDailyGoal ?? 50,
    xpReadingPresence: systemSettings?.gamification?.xpReadingPresence ?? 5,
  });
  const isDayComplete = dailyReading ? checkDayCompletion(dailyReading) : false;
  const statusLabel = progressSummary.dayCompleted ? 'Meta concluida' : progressSummary.completedChapters > 0 ? 'Em andamento' : progressSummary.isToday ? 'Leitura de hoje' : progressSummary.daysBehind > 0 ? 'Dia pendente' : 'Proxima leitura';
  const statusTone = progressSummary.dayCompleted
    ? 'text-green-700 bg-green-50 border-green-100 dark:text-green-300 dark:bg-green-900/10 dark:border-green-900/40'
    : progressSummary.completedChapters > 0
      ? 'text-blue-700 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-900/10 dark:border-blue-900/40'
      : 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-900/10 dark:border-amber-900/40';
  const journeyMessage = progressSummary.dayCompleted
    ? 'A Palavra de hoje ja foi guardada. Volte amanha ou avance se quiser manter o ritmo.'
    : progressSummary.completedChapters > 0
      ? 'Voce ja entrou na leitura de hoje. Falta pouco para fechar a meta diaria.'
      : 'Este e o seu encontro diario com a Palavra. Comece pequeno, mas comece hoje.';
  const paceLabel = {
    iniciando: 'iniciando',
    leve: 'leve',
    constante: 'constante',
    profundo: 'profundo',
  }[progressSummary.readingPaceLabel];
  const heroProgressStyle = {
    background: `conic-gradient(#d4a64f ${progressSummary.dayPercent * 3.6}deg, rgba(255,255,255,0.16) 0deg)`,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f7f4] dark:bg-black/30">
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="mt-1 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/80 bg-white/80 text-gray-500 shadow-sm transition-colors hover:text-bible-leather dark:border-gray-800 dark:bg-bible-darkPaper dark:text-gray-400 dark:hover:text-bible-gold"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-bible-gold">Jornada diaria</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-bible-leather dark:text-bible-gold md:text-4xl">Meta de Leitura</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Acompanhe presenca, progresso e constancia sem perder o foco principal: voltar para a Palavra hoje.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{scopeLabel[planSettings.planScope]}</span>
            <button onClick={() => setResetModalOpen(true)} className="p-2 hover:text-red-500 text-gray-400 transition-colors" title="Reiniciar Plano"><RotateCcw size={18} /></button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper md:p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-wrap gap-2 flex-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-gray-900">
              {[{ id: 'progress', label: 'Leitura', icon: <BookOpen size={14} /> }, { id: 'routine', label: 'Rotina', icon: <ListTodo size={14} /> }, { id: 'settings', label: 'Ajustes', icon: <Settings size={14} /> }].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-bible-leather shadow-sm dark:bg-gray-800 dark:text-bible-gold' : 'text-gray-500 hover:bg-white/70 dark:hover:bg-gray-800'}`}>{tab.icon} {tab.label}</button>
              ))}
            </div>
          </div>

          {activeTab === 'progress' && (
            <div className="animate-in fade-in space-y-5">
              <section className="overflow-hidden rounded-3xl bg-bible-leather text-white shadow-xl shadow-bible-leather/10">
                <div className="grid gap-6 p-5 md:grid-cols-[1fr_280px] md:p-7">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone}`}>
                        <Target size={13} />
                        {statusLabel}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/60">Dia {viewDay} da jornada</p>
                        <h2 className="mt-1 font-serif text-4xl font-bold leading-tight md:text-5xl">Leitura de Hoje</h2>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{journeyMessage}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Flame className="mx-auto mb-1 text-bible-gold" size={18} />
                        <p className="text-xl font-black">{planSettings.streak || 0}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Sequencia</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Clock3 className="mx-auto mb-1 text-bible-gold" size={18} />
                        <p className="text-xl font-black">{formatPresenceMinutes(progressSummary.activeMinutesToday)}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Na Palavra</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <Gift className="mx-auto mb-1 text-bible-gold" size={18} />
                        <p className="text-xl font-black">+{progressSummary.availableManaToday}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Mana possivel</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <TimerReset className="mx-auto mb-1 text-bible-gold" size={18} />
                        <p className="text-xl font-black">{progressSummary.estimatedMinutesRemaining}m</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Restante</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button onClick={() => handleStartReading(0)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-bible-gold px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.01]">
                        <BookOpen size={17} />
                        {progressSummary.completedChapters > 0 ? 'Continuar leitura' : 'Comecar leitura'}
                      </button>
                      <button onClick={() => setViewDay(progressSummary.planDay)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-white/85 transition-colors hover:bg-white/10">
                        <CalendarDays size={17} />
                        Hoje
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/10 p-5">
                    <div className="grid size-40 place-items-center rounded-full p-3" style={heroProgressStyle}>
                      <div className="grid size-32 place-items-center rounded-full bg-bible-leather text-center shadow-inner">
                        <div>
                          <p className="text-4xl font-black">{progressSummary.dayPercent}%</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/55">do dia</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 w-full">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
                        <span>{progressSummary.completedChapters}/{progressSummary.totalChapters} capitulos</span>
                        <span>{dailyReading?.dateDisplay}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/15">
                        <div className="h-2 rounded-full bg-bible-gold transition-all" style={{ width: `${progressSummary.dayPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <TrendingUp className="mb-3 text-blue-500" size={20} />
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{progressSummary.planPercent}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Jornada total</p>
                </div>
                <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <Trophy className="mb-3 text-bible-gold" size={20} />
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{progressSummary.completedPlanDays}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dias concluidos</p>
                </div>
                <div className="rounded-3xl border border-green-100 bg-green-50/70 p-4 dark:border-green-900/30 dark:bg-green-900/10">
                  <ShieldCheck className="mb-3 text-green-500" size={20} />
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{progressSummary.nextMilestoneDays}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Para marco 7d</p>
                </div>
                <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/30 dark:bg-purple-900/10">
                  <Gift className="mb-3 text-purple-500" size={20} />
                  <p className="text-2xl font-black text-gray-900 dark:text-white">+{progressSummary.earnedManaToday}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mana hoje</p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 dark:bg-gray-900">
                  <button aria-label="Dia anterior" onClick={() => setViewDay((value) => Math.max(1, value - 1))} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-all"><ChevronLeft size={20} /></button>
                  <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Dia {viewDay}</p>
                    <span className="text-[10px] text-gray-400 font-bold">{dailyReading?.dateDisplay}</span>
                  </div>
                  <button aria-label="Proximo dia" onClick={() => setViewDay((value) => Math.min(progressSummary.totalPlanDays, value + 1))} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-all"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {dailyReading?.readings.map((readingSection, index) => {
                    const sectionVisual = getSectionVisual(readingSection.section);
                    const chaptersRange = Array.from({ length: readingSection.endChapter - readingSection.startChapter + 1 }, (_, chapterIndex) => readingSection.startChapter + chapterIndex);
                    const userRead = userProfile?.progress?.readChapters?.[readingSection.bookId] || [];
                    const isSectionComplete = chaptersRange.every((chapter) => userRead.includes(chapter)) || (planSettings.completedSections?.[dailyReading.day] || []).includes(index);
                    const sectionProgress = chaptersRange.filter((chapter) => userRead.includes(chapter)).length;
                    const sectionPercent = chaptersRange.length ? Math.round((sectionProgress / chaptersRange.length) * 100) : 0;

                    return (
                      <button key={index} onClick={() => handleStartReading(index)} className={`w-full rounded-3xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isSectionComplete ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 hover:border-bible-gold'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${sectionVisual.tone}`}>
                            {sectionVisual.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="text-[10px] font-black text-bible-gold uppercase tracking-widest">{readingSection.section}</p>
                              {isSectionComplete && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-700 dark:bg-green-900/30 dark:text-green-300">feito</span>}
                            </div>
                            <p className="text-lg font-serif font-bold text-gray-900 dark:text-white">{readingSection.ref}</p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                <div className="h-2 rounded-full bg-bible-gold transition-all" style={{ width: `${sectionPercent}%` }} />
                              </div>
                              <p className="shrink-0 text-xs font-bold text-gray-400">{sectionProgress}/{chaptersRange.length}</p>
                            </div>
                          </div>
                          {isSectionComplete ? <CheckCircle2 size={24} className="text-green-500 shrink-0" /> : <ChevronRight size={20} className="text-gray-300 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isDayComplete && (
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} /> Meta do Dia Concluida!
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-bible-gold">Presenca com a Palavra</p>
                    <h3 className="mt-1 font-bold text-gray-900 dark:text-white">Tempo ativo de leitura</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Conta apenas enquanto voce esta na tela, com a aba em foco e interagindo com a leitura.</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${progressSummary.presenceGoalMet ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                    {progressSummary.presenceGoalMet ? '5 min cumpridos' : 'Meta: 5 min'}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-gray-50 p-3 dark:bg-black/20">
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatPresenceMinutes(progressSummary.activeMinutesToday)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hoje</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3 dark:bg-black/20">
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatPresenceMinutes(progressSummary.activeMinutesWeek)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">7 dias</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3 dark:bg-black/20">
                    <p className="text-xl font-black capitalize text-gray-900 dark:text-white">{paceLabel}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ritmo</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3 dark:bg-black/20">
                    <p className="text-xl font-black text-gray-900 dark:text-white">+{progressSummary.presenceManaEarnedToday || progressSummary.presenceManaAvailableToday}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{progressSummary.presenceManaEarnedToday ? 'Mana recebido' : 'Bonus disponivel'}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-bible-gold">Calendario vivo</p>
                    <h3 className="font-bold text-gray-900 dark:text-white">Ultimos e proximos dias</h3>
                  </div>
                  {progressSummary.daysBehind > 0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 dark:bg-red-900/20 dark:text-red-300">
                      {progressSummary.daysBehind} dia(s) pendente(s)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-10 gap-2">
                  {progressSummary.calendar.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setViewDay(day.day)}
                      className={`aspect-square rounded-lg border text-[10px] font-black transition-transform hover:scale-105 ${calendarClass(day.status)} ${day.day === viewDay ? 'ring-2 ring-bible-gold ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                      title={`Dia ${day.day}`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> Concluido</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-bible-gold" /> Parcial</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-200" /> Pendente</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-gray-200 dark:bg-gray-700" /> Futuro</span>
                </div>
              </section>

            </div>
          )}

          {activeTab === 'routine' && (
            <div className="text-center py-10 animate-in fade-in">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                <ListTodo size={32} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Minha Rotina Diaria</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Gerencie seus habitos espirituais e acompanhe sua disciplina diaria.</p>
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
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Ativar Notificacoes</p>
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
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Horario do Lembrete</label>
                  <input
                    type="time"
                    value={planSettings.notificationTime || '08:00'}
                    onChange={(event) => handleUpdateSettings({ notificationTime: event.target.value })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bible-gold font-bold"
                  />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30">
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} /> Zona de Perigo
                </h3>
                <p className="text-xs text-red-600 dark:text-red-300 mb-6 leading-relaxed">
                  Deseja cancelar seu plano atual? Todo o progresso de dias e sequencia sera resetado. O historico de capitulos lidos na Biblia sera mantido.
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

        <ConfirmationModal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} onConfirm={handleResetPlan} title="Reiniciar Plano?" message="Isso apagara suas configuracoes de data, mas seu progresso de leitura nos livros sera mantido no historico global." confirmText="Sim, Reiniciar" variant="danger" />
      </div>
    </div>
  );
};

export default ReadingPlanDashboard;

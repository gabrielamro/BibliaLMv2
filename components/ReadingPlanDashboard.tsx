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
  Compass,
  Flame,
  Gift,
  ListTodo,
  Loader2,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { dbService } from '../services/supabase';
import { DailyReading, PlanProgress, PlanScope } from '../types';
import { getReadingForDay } from '../services/readingPlanService';
import { buildReadingPlanUrl } from '../utils/readingPlanRoute';
import { getReadingPlanProgressSummary } from '../utils/readingPlanProgress';
import ReadingPlanOnboarding from './ReadingPlanOnboarding';
import ConfirmationModal from './ConfirmationModal';
import { DEVOTIONAL_TRACKS, type DevotionalTrack } from './devotional/DevotionalTracksModal';
import toast from 'react-hot-toast';

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

  // Estado das Trilhas Temáticas (Fase 5)
  const [activeTrackId, setActiveTrackId] = useState<string>('vencendo-ansiedade');
  const [activeTrackDay, setActiveTrackDay] = useState<number>(3);
  const [isTrackPaused, setIsTrackPaused] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'trilhas') {
        navigate('/trilhas');
      }
    }
  }, [navigate]);

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

  const summary = getReadingPlanProgressSummary({
    reading: dailyReading,
    progress: planSettings,
  });
  const activeTrack = DEVOTIONAL_TRACKS.find((t) => t.id === activeTrackId) || DEVOTIONAL_TRACKS[0];
  const trackProgressPercent = Math.round((activeTrackDay / activeTrack.durationDays) * 100);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!planSettings.isActive) {
    return (
      <ReadingPlanOnboarding
        onStart={(startToday, scope) => {
          setPlanSettings((prev) => ({
            ...prev,
            isActive: true,
            planScope: scope,
            startDate: new Date().toISOString(),
          }));
        }}
      />
    );
  }

  const isViewDayDone = planSettings.completedDays.includes(viewDay);
  const isViewDayPartial = summary.completedSections > 0 && !isViewDayDone;
  const statusLabel = isViewDayDone ? 'Leitura Concluida' : isViewDayPartial ? 'Em Progresso' : 'Pendente de Hoje';
  const statusTone = isViewDayDone
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isViewDayPartial
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-white/10 text-white/80 border-white/20';

  const journeyMessage = isViewDayDone
    ? 'Parabéns! Você concluiu os capítulos de hoje. Deus fortalece seu coração na constância.'
    : isViewDayPartial
      ? `Você já completou ${summary.completedSections} de ${summary.totalSections} blocos da leitura de hoje.`
      : 'Avance no seu tempo. O importante é criar o hábito diário de ouvir a Deus na Bíblia.';

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Jornada diária</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#0b1530] dark:text-white md:text-4xl">Meta de Leitura & Trilhas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Acompanhe presença, progresso, planos e trilhas temáticas para manter o foco na Palavra.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-2xl border border-[#e6e0d8] bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-[#111113]">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{scopeLabel[planSettings.planScope]}</span>
          <button onClick={() => setResetModalOpen(true)} className="p-2 hover:text-red-500 text-gray-400 transition-colors" title="Reiniciar Plano"><RotateCcw size={18} /></button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e6e0d8] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#111113] md:p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-wrap gap-2 flex-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-gray-900" role="tablist" aria-label="Abas da Meta de Leitura">
            {[
              { id: 'progress', label: 'Leitura', icon: <BookOpen size={14} /> },
              { id: 'routine', label: 'Rotina', icon: <ListTodo size={14} /> },
              { id: 'settings', label: 'Ajustes', icon: <Settings size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-gray-500 hover:bg-white/70 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ABA MINHA META */}
        {activeTab === 'progress' && (
          <div className="animate-in fade-in space-y-5">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1530] via-[#063f3a] to-[#087a6b] text-white shadow-xl shadow-emerald-950/10">
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
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Concluído</span>
                      <strong className="mt-1 block font-serif text-xl font-bold">{summary.planPercent}%</strong>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Sequência</span>
                      <strong className="mt-1 block font-serif text-xl font-bold">{planSettings.streak} dias</strong>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Capítulos</span>
                      <strong className="mt-1 block font-serif text-xl font-bold">{summary.completedSections}/{summary.totalSections}</strong>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Presença</span>
                      <strong className="mt-1 block font-serif text-xl font-bold">{formatPresenceMinutes(summary.activeMinutesToday)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-white/10 p-5 backdrop-blur">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Ação principal</span>
                    <h3 className="mt-1 font-serif text-lg font-bold">Acessar Leitura Bíblica</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/75">
                      Leia os capítulos atribuídos ao Dia {viewDay} diretamente no leitor da Bíblia Sagrada.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const url = dailyReading ? buildReadingPlanUrl(dailyReading) : '/bibliasagrada';
                      navigate(url);
                    }}
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-black uppercase tracking-wider text-emerald-950 shadow-md transition hover:bg-emerald-50"
                  >
                    <BookOpen size={16} /> Continuar leitura
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}


      </div>

      <ConfirmationModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={() => {
          setPlanSettings(defaultPlanSettings);
          setResetModalOpen(false);
          toast.success('Plano de leitura reiniciado.');
        }}
        title="Reiniciar Plano de Leitura?"
        message="Seu progresso será zerado e você poderá escolher um novo plano."
        confirmText="Reiniciar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ReadingPlanDashboard;

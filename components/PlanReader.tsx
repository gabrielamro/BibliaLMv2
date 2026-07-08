"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Brain, Save, Loader2, BookOpen, PenTool, Lightbulb, RefreshCw, AlertCircle, Clock3 } from 'lucide-react';
import { DailyReading, Chapter, PlanProgress, MoodType } from '../types';
import { analyzeUnderstanding, generateReadingConnection } from '../services/pastorAgent';
import { getReadingForDay } from '../services/readingPlanService';
import { parseReadingPlanSearchParams } from '../utils/readingPlanRoute';
import { bibleService } from '../services/bibleService';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BIBLE_BOOKS_LIST } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import ConfirmationModal from './ConfirmationModal';
import CompletionModal from './plan/CompletionModal'; 
import SmartText from './reader/SmartText';

const createDefaultProgress = (): PlanProgress => ({
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
});

const formatReadingPresence = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
};

const VERSES_PER_PAGE = 10;

const PlanReader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, recordActivity, openLogin, markChapterCompleted, userProfile } = useAuth();
  const { settings } = useSettings();
  
  const { dailyReading: initialDailyReading, planProgress: initialProgress, initialSectionIdx, preloadedContent, resumeChapter } = location.state as { dailyReading: DailyReading, planProgress: PlanProgress, initialSectionIdx?: number, preloadedContent?: Chapter, resumeChapter?: number } || {};

  const searchKey = searchParams.toString();
  const routeParams = useMemo(() => parseReadingPlanSearchParams(new URLSearchParams(searchKey)), [searchKey]);
  const profilePlan = userProfile?.readingPlan;
  const resolvedProgress = useMemo(
    () => initialProgress || profilePlan || createDefaultProgress(),
    [initialProgress, profilePlan]
  );
  const routeDailyReading = useMemo(() => {
    if (initialDailyReading) return initialDailyReading;

    const planType = routeParams.planType || profilePlan?.planType || '365';
    const planScope = routeParams.scope || profilePlan?.planScope || 'all';
    const startDate = routeParams.startDate || profilePlan?.startDate;

    return getReadingForDay(routeParams.day, planType, startDate, planScope);
  }, [initialDailyReading, profilePlan?.planScope, profilePlan?.planType, profilePlan?.startDate, routeParams]);

  const [dailyReading, setDailyReading] = useState<DailyReading | null>(routeDailyReading);
  const [localProgress, setLocalProgress] = useState<PlanProgress>(resolvedProgress);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(initialSectionIdx ?? routeParams.sectionIndex);
  
  const currentReading = dailyReading?.readings[currentSectionIdx];
  const [currentChapterNum, setCurrentChapterNum] = useState(() => resumeChapter || routeParams.chapter || currentReading?.startChapter || 1);
  const [currentVersePage, setCurrentVersePage] = useState(0);
  
  const [chapterContent, setChapterContent] = useState<Chapter | null>(preloadedContent || null);
  const [isLoading, setIsLoading] = useState(!preloadedContent);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyConnection, setDailyConnection] = useState<{theme: string, conclusion: string} | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [activeReadingSeconds, setActiveReadingSeconds] = useState(0);
  const activeReadingSecondsRef = useRef(0);
  const lastPersistedSecondsRef = useRef(0);
  const lastActivityAtRef = useRef(Date.now());
  const presenceAwardedRef = useRef(false);

  useEffect(() => {
    setDailyReading(routeDailyReading);
  }, [routeDailyReading]);

  useEffect(() => {
    setLocalProgress(resolvedProgress);
  }, [resolvedProgress]);

  useEffect(() => {
    const day = dailyReading?.day || 0;
    const entry = day ? localProgress.timeLog?.[day] : undefined;
    const seconds = entry?.activeSeconds || 0;
    setActiveReadingSeconds(seconds);
    activeReadingSecondsRef.current = seconds;
    lastPersistedSecondsRef.current = seconds;
    presenceAwardedRef.current = !!entry?.awardedPresenceMana;
  }, [dailyReading?.day, localProgress.timeLog]);

  useEffect(() => {
    const nextSectionIdx = Math.min(initialSectionIdx ?? routeParams.sectionIndex, Math.max((dailyReading?.readings.length || 1) - 1, 0));
    setCurrentSectionIdx(nextSectionIdx);
  }, [dailyReading?.readings.length, initialSectionIdx, routeParams.sectionIndex]);

  useEffect(() => {
    setCurrentChapterNum(resumeChapter || routeParams.chapter || currentReading?.startChapter || 1);
  }, [currentReading?.bookId, currentReading?.startChapter, resumeChapter, routeParams.chapter]);

  useEffect(() => {
    setCurrentVersePage(0);
  }, [currentChapterNum, currentSectionIdx, settings.bibleVersion]);

  useEffect(() => {
    if (!dailyReading) return;
    if (dailyReading.readings.length > 1) {
        const loadConnection = async () => {
        const connection = await generateReadingConnection(dailyReading.readings.map(r => r.ref));
        setDailyConnection(connection);
        };
        loadConnection();
    }
  }, [dailyReading, navigate]);

  const persistActiveReadingTime = useCallback(async (seconds: number, awardedPresenceMana = false) => {
    if (!currentUser || !dailyReading) return;

    const currentEntry = localProgress.timeLog?.[dailyReading.day];
    const nextEntry = {
      activeSeconds: Math.max(seconds, currentEntry?.activeSeconds || 0),
      awardedPresenceMana: currentEntry?.awardedPresenceMana || awardedPresenceMana,
      sessions: currentEntry?.sessions || 1,
      lastTrackedAt: new Date().toISOString(),
    };
    const nextProgress = {
      ...localProgress,
      timeLog: {
        ...(localProgress.timeLog || {}),
        [dailyReading.day]: nextEntry,
      },
    };

    setLocalProgress(nextProgress);
    lastPersistedSecondsRef.current = nextEntry.activeSeconds;
    await dbService.updateUserProfile(currentUser.uid, { readingPlan: nextProgress });
  }, [currentUser, dailyReading, localProgress]);

  useEffect(() => {
    if (!dailyReading || !currentReading) return;

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    markActivity();

    const interval = window.setInterval(async () => {
      const isActivelyReading =
        document.visibilityState === 'visible' &&
        document.hasFocus() &&
        !completionModalOpen &&
        Date.now() - lastActivityAtRef.current < 60000;

      if (!isActivelyReading) return;

      const nextSeconds = activeReadingSecondsRef.current + 1;
      activeReadingSecondsRef.current = nextSeconds;
      setActiveReadingSeconds(nextSeconds);

      if (nextSeconds - lastPersistedSecondsRef.current >= 15) {
        await persistActiveReadingTime(nextSeconds);
      }

      if (nextSeconds >= 300 && !presenceAwardedRef.current) {
        presenceAwardedRef.current = true;
        await persistActiveReadingTime(nextSeconds, true);
        await recordActivity('reading_presence', `5 minutos de presenca na Palavra - Dia ${dailyReading.day}`, {
          sourceId: `plan-day-${dailyReading.day}`,
          readingSeconds: nextSeconds,
          sourceType: 'reading_plan',
        });
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      if (activeReadingSecondsRef.current > lastPersistedSecondsRef.current) {
        void persistActiveReadingTime(activeReadingSecondsRef.current, presenceAwardedRef.current);
      }
    };
  }, [completionModalOpen, currentReading, dailyReading, persistActiveReadingTime, recordActivity]);

  const fetchContent = async () => {
    if (!dailyReading || !currentReading) return;
    setIsLoading(true); setError(null); setAiAnalysis(null);
    try {
      const data = await bibleService.getChapter(currentReading.bookId, currentChapterNum, settings.bibleVersion || 'ara');
      if (data) { setChapterContent(data); window.scrollTo(0, 0); }
      else setError("Falha ao carregar capítulo.");
    } catch (e) { setError("Erro de conexão."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { 
      if (!preloadedContent || currentChapterNum !== preloadedContent.number) fetchContent(); 
  }, [currentChapterNum, currentSectionIdx, settings.bibleVersion, dailyReading]);

  const handleNextPage = async () => {
      if (!currentReading) return;

      const totalVersePages = Math.max(1, Math.ceil((chapterContent?.verses.length || 0) / VERSES_PER_PAGE));
      if (currentVersePage < totalVersePages - 1) {
          setCurrentVersePage(prev => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      if (currentUser) {
          await markChapterCompleted(currentReading.bookId, currentChapterNum);
      }

      if (currentChapterNum < currentReading.endChapter) {
          setCurrentChapterNum(prev => prev + 1);
      } else {
          setCompletionModalOpen(true);
      }
  };

  const handleFinishSection = async (mood: MoodType | null = null, note: string = '') => {
    if (!currentUser) { openLogin(); return; }
    if (!dailyReading) return;
    setCompletionModalOpen(false);

    const currentSections = localProgress.completedSections?.[dailyReading.day] || [];
    
    let newSections = [...currentSections];
    if (!newSections.includes(currentSectionIdx)) {
        newSections.push(currentSectionIdx);
    }

    const dayCompleted = newSections.length === dailyReading.readings.length;
    const alreadyCompletedDay = localProgress.completedDays.includes(dailyReading.day);
    
    const newProgress = { 
        ...localProgress, 
        completedDays: [...(localProgress.completedDays || [])],
        completedSections: { ...localProgress.completedSections, [dailyReading.day]: newSections }, 
        streak: dayCompleted && !alreadyCompletedDay ? (localProgress.streak || 0) + 1 : localProgress.streak,
        lastReadingDate: new Date().toISOString(),
        reflectionLog: {
            ...(localProgress.reflectionLog || {}),
            [dailyReading.day]: { mood, note: note.trim(), updatedAt: new Date().toISOString() },
        },
    };

    if (dayCompleted && !alreadyCompletedDay) {
        newProgress.completedDays.push(dailyReading.day);
        await recordActivity('daily_goal', `Meta do dia ${dailyReading.day} concluída!`);
    }

    setLocalProgress(newProgress);
    await dbService.updateUserProfile(currentUser.uid, { readingPlan: newProgress });

    if (note.trim()) {
        await dbService.add(currentUser.uid, 'notes', {
            bookId: 'plano',
            chapter: dailyReading.day,
            title: `Reflexao da meta - Dia ${dailyReading.day}`,
            content: note.trim(),
            sourceText: dailyReading.readings.map(reading => reading.ref).join(', '),
            mood,
            createdAt: new Date().toISOString(),
        });
    }
    
    if (currentSectionIdx < dailyReading.readings.length - 1) {
        const nextIdx = currentSectionIdx + 1;
        setCurrentSectionIdx(nextIdx);
        setCurrentChapterNum(dailyReading.readings[nextIdx].startChapter);
    } else {
        navigate('/plano');
    }
  };

  const getFontSizeClass = () => {
     const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
     return sizes[settings.fontSize - 1] || 'text-lg';
  };
  
  const bookName = currentReading ? BIBLE_BOOKS_LIST.find(b => b.id === currentReading.bookId)?.name : '';
  const chapterCount = currentReading ? currentReading.endChapter - currentReading.startChapter + 1 : 1;
  const currentChapterStep = currentReading ? currentChapterNum - currentReading.startChapter + 1 : 1;
  const totalVersePages = Math.max(1, Math.ceil((chapterContent?.verses.length || 0) / VERSES_PER_PAGE));
  const visibleVerses = chapterContent?.verses.slice(currentVersePage * VERSES_PER_PAGE, (currentVersePage + 1) * VERSES_PER_PAGE) || [];
  const versePageStart = chapterContent?.verses.length ? currentVersePage * VERSES_PER_PAGE + 1 : 0;
  const versePageEnd = Math.min((currentVersePage + 1) * VERSES_PER_PAGE, chapterContent?.verses.length || 0);
  const versePagePercent = Math.min(100, Math.max(0, Math.round(((currentVersePage + 1) / totalVersePages) * 100)));
  const sectionProgressPercent = Math.min(100, Math.max(0, Math.round((((currentChapterStep - 1) + ((currentVersePage + 1) / totalVersePages)) / chapterCount) * 100)));
  const nextButtonLabel = currentVersePage < totalVersePages - 1
    ? 'Proximos versiculos'
    : currentChapterNum < (currentReading?.endChapter || currentChapterNum)
      ? 'Proximo capitulo'
      : currentSectionIdx === (dailyReading?.readings.length || 0) - 1
        ? 'Concluir Dia'
        : 'Proxima Leitura';

  if (!dailyReading || !currentReading) {
    return (
      <div className="flex flex-col h-screen bg-bible-paper dark:bg-bible-darkPaper items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-bible-gold mb-3" size={36}/>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Preparando leitura...</p>
        <button onClick={() => navigate('/plano')} className="mt-6 text-sm font-bold text-bible-gold hover:underline">
          Voltar ao plano
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f7f4ed] dark:bg-black">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-2xl mx-auto pb-36">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={() => navigate('/plano')} className="grid size-11 place-items-center rounded-full border border-black/5 bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-bible-gold dark:border-white/10 dark:bg-bible-darkPaper" aria-label="Voltar ao plano">
                <ArrowLeft size={22}/>
              </button>
              <div className="flex min-w-0 flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-bible-gold shadow-sm dark:bg-bible-darkPaper">
                  <Clock3 size={12} /> {formatReadingPresence(activeReadingSeconds)}
                </span>
                <span className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">{dailyReading?.dateDisplay}</span>
              </div>
            </div>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center mt-20">
                    <Loader2 className="animate-spin text-bible-gold mb-2" size={40}/>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando Palavra...</p>
                </div>
            ) : (
            <article className={`rounded-[28px] border border-black/5 bg-white px-5 py-6 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper md:px-8 md:py-8 ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                <div className="mb-8 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bible-gold">{currentReading.section}</p>
                  <h2 className="mt-2 text-3xl font-bold text-bible-leather dark:text-bible-gold">
                    {bookName} {currentChapterNum}
                  </h2>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                    Capitulo {currentChapterStep} de {chapterCount} · versiculos {versePageStart}-{versePageEnd}
                  </p>
                  <div className="mx-auto mt-4 h-2 max-w-xs rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-2 rounded-full bg-bible-gold transition-all" style={{ width: `${versePagePercent}%` }} />
                  </div>
                </div>
                <div className={`space-y-6 leading-loose text-gray-800 dark:text-gray-200 ${getFontSizeClass()}`}>
                    {visibleVerses.map(v => (
                        <p key={v.number} className="relative rounded-xl p-2 pl-4 transition-colors group hover:bg-black/5 dark:hover:bg-white/5">
                            <span className="absolute -left-2 top-1.5 text-[10px] font-sans font-black text-bible-gold/50 select-none group-hover:text-bible-gold">{v.number}</span>
                            <SmartText text={v.text} enabled={settings.smartReadingMode || true} />
                        </p>
                    ))}
                </div>
            </article>
            )}
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed] to-transparent p-4 pb-8 pt-12 dark:from-black dark:via-black">
          <div className="max-w-xl mx-auto rounded-3xl border border-black/5 bg-white/90 p-3 shadow-2xl shadow-black/10 backdrop-blur dark:border-white/10 dark:bg-bible-darkPaper/90">
            <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <span>{currentReading.section}</span>
              <span>{sectionProgressPercent}% do trecho</span>
            </div>
            <div className="mb-3 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-1.5 rounded-full bg-bible-gold transition-all" style={{ width: `${sectionProgressPercent}%` }} />
            </div>
            <button 
                onClick={handleNextPage} 
                className="w-full min-h-14 rounded-2xl bg-bible-leather px-4 py-4 font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.01] active:scale-95 dark:bg-bible-gold dark:text-black flex items-center justify-center gap-2"
            >
                {nextButtonLabel}
                {currentVersePage >= totalVersePages - 1 && currentChapterNum >= currentReading.endChapter ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
      </div>
      <CompletionModal
        isOpen={completionModalOpen}
        dailyReading={dailyReading}
        dailyConnection={dailyConnection}
        localProgress={localProgress}
        currentSectionIdx={currentSectionIdx}
        onFinish={handleFinishSection}
      />
    </div>
  );
};

export default PlanReader;

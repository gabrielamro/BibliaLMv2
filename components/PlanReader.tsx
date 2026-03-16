"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useCallback } from 'react';

import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Brain, Save, Loader2, BookOpen, PenTool, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';
import { DailyReading, Chapter, PlanProgress } from '../types';
import { analyzeUnderstanding, generateReadingConnection } from '../services/geminiService';
import { bibleService } from '../services/bibleService';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BIBLE_BOOKS_LIST } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import ConfirmationModal from './ConfirmationModal';
import CompletionModal from './plan/CompletionModal'; 
import SmartText from './reader/SmartText';

const PlanReader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, recordActivity, openLogin, markChapterCompleted } = useAuth();
  const { settings } = useSettings();
  
  const { dailyReading: initialDailyReading, planProgress: initialProgress, initialSectionIdx, preloadedContent, resumeChapter } = location.state as { dailyReading: DailyReading, planProgress: PlanProgress, initialSectionIdx?: number, preloadedContent?: Chapter, resumeChapter?: number } || {};

  const [dailyReading] = useState<DailyReading | null>(initialDailyReading || null);
  const [localProgress, setLocalProgress] = useState<PlanProgress>(initialProgress);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(initialSectionIdx || 0);
  
  const currentReading = dailyReading?.readings[currentSectionIdx];
  const [currentChapterNum, setCurrentChapterNum] = useState(() => resumeChapter || currentReading?.startChapter || 1);
  
  const [chapterContent, setChapterContent] = useState<Chapter | null>(preloadedContent || null);
  const [isLoading, setIsLoading] = useState(!preloadedContent);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyConnection, setDailyConnection] = useState<{theme: string, conclusion: string} | null>(null);

  useEffect(() => {
    if (!dailyReading) { navigate('/plano'); return; }
    if (dailyReading.readings.length > 1) {
        const loadConnection = async () => {
        const connection = await generateReadingConnection(dailyReading.readings.map(r => r.ref));
        setDailyConnection(connection);
        };
        loadConnection();
    }
  }, [dailyReading, navigate]);

  const fetchContent = async () => {
    if (!dailyReading || !currentReading) return;
    setIsLoading(true); setError(null); setAiAnalysis(null);
    try {
      const data = await bibleService.getChapter(currentReading.bookId, currentChapterNum);
      if (data) { setChapterContent(data); window.scrollTo(0, 0); }
      else setError("Falha ao carregar capítulo.");
    } catch (e) { setError("Erro de conexão."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { 
      if (!preloadedContent || currentChapterNum !== preloadedContent.number) fetchContent(); 
  }, [currentChapterNum, currentSectionIdx]);

  const handleNextChapter = async () => {
      if (!currentReading) return;
      
      if (currentUser) {
          await markChapterCompleted(currentReading.bookId, currentChapterNum);
      }

      if (currentChapterNum < currentReading.endChapter) {
          setCurrentChapterNum(prev => prev + 1);
      } else {
          handleFinishSection();
      }
  };

  const handleFinishSection = async () => {
    if (!currentUser) { openLogin(); return; }
    if (!dailyReading) return;

    const currentSections = localProgress.completedSections?.[dailyReading.day] || [];
    
    let newSections = [...currentSections];
    if (!newSections.includes(currentSectionIdx)) {
        newSections.push(currentSectionIdx);
    }

    const dayCompleted = newSections.length === dailyReading.readings.length;
    
    const newProgress = { 
        ...localProgress, 
        completedSections: { ...localProgress.completedSections, [dailyReading.day]: newSections }, 
        streak: dayCompleted ? (localProgress.streak || 0) + 1 : localProgress.streak 
    };

    if (dayCompleted && !newProgress.completedDays.includes(dailyReading.day)) {
        newProgress.completedDays.push(dailyReading.day);
        await recordActivity('daily_goal', `Meta do dia ${dailyReading.day} concluída!`);
    }

    setLocalProgress(newProgress);
    await dbService.updateUserProfile(currentUser.uid, { readingPlan: newProgress });
    
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

  return (
    <div className="flex flex-col h-screen bg-bible-paper dark:bg-bible-darkPaper overflow-hidden">
      <header className="bg-white dark:bg-bible-darkPaper border-b border-gray-100 dark:border-gray-800 p-4 shadow-sm z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
              <button onClick={() => navigate('/plano')} className="p-2 -ml-2 text-gray-500 hover:text-bible-gold">
                  <ArrowLeft size={24}/>
              </button>
              <div className="text-center">
                  <h1 className="font-bold text-xs uppercase tracking-widest text-gray-400">{dailyReading?.dateDisplay}</h1>
                  <p className="font-serif font-bold text-gray-900 dark:text-white">
                      {bookName} {currentChapterNum} <span className="text-gray-400 font-sans text-xs">/ {currentReading?.endChapter}</span>
                  </p>
              </div>
              <div className="w-6"/>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-2xl mx-auto pb-32">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center mt-20">
                    <Loader2 className="animate-spin text-bible-gold mb-2" size={40}/>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando Palavra...</p>
                </div>
            ) : (
            <div className={`space-y-6 ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                <h2 className="text-3xl font-bold text-center text-bible-leather dark:text-bible-gold mb-8 mt-4">
                    {bookName} {currentChapterNum}
                </h2>
                <div className={`space-y-6 leading-loose text-gray-800 dark:text-gray-200 ${getFontSizeClass()}`}>
                    {chapterContent?.verses.map(v => (
                        <p key={v.number} className="relative pl-2 group hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors p-1">
                            <span className="absolute -left-2 top-1.5 text-[10px] font-sans font-black text-bible-gold/50 select-none group-hover:text-bible-gold">{v.number}</span>
                            <SmartText text={v.text} enabled={settings.smartReadingMode || true} />
                        </p>
                    ))}
                </div>
            </div>
            )}
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black pb-8 pt-12">
          <div className="max-w-xl mx-auto">
            <button 
                onClick={handleNextChapter} 
                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {currentReading && currentChapterNum >= currentReading.endChapter 
                    ? (currentSectionIdx === (dailyReading?.readings.length || 0) - 1 ? 'Concluir Dia' : 'Próxima Leitura') 
                    : 'Próximo Capítulo'
                } 
                {currentReading && currentChapterNum >= currentReading.endChapter ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
      </div>
    </div>
  );
};

export default PlanReader;

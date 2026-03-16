"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect } from 'react';
import { Sun, Calendar, Share2, Heart, Sparkles, Loader2, MessageCircle, Brain, CheckCircle2, RefreshCw, Save, Lock } from 'lucide-react';

import { DAILY_BREAD as FALLBACK_BREAD } from '../constants';
import { analyzeUnderstanding, generateDailyDevotional } from '../services/geminiService';
import { Note, Devotional as DevotionalType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { generateShareLink } from '../utils/shareUtils';

const Devotional: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, deductPoints, earnMana, openBuyCredits } = useAuth();

  const [devotional, setDevotional] = useState<DevotionalType | null>(null);
  const [reflection, setReflection] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
  const [hasSaidAmen, setHasSaidAmen] = useState(false);
  const [showAmenToast, setShowAmenToast] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const loadDevotional = async (forceNew = false) => {
    setIsGenerating(true);
    const today = new Date().toLocaleDateString('pt-BR');
    const cacheKey = `devotional_cache`;
    const cached = localStorage.getItem(cacheKey);

    if (!forceNew && cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          setDevotional(parsed);
          setIsGenerating(false);
          checkAmenStatus(today);
          return;
        }
      } catch (e) { console.error(e); }
    }

    // Force new generation (bypassCache=true) if forceNew is true
    const newDevo = await generateDailyDevotional(forceNew);
    
    if (newDevo) {
      setDevotional(newDevo);
      localStorage.setItem(cacheKey, JSON.stringify(newDevo));
      setHasSaidAmen(false); 
    } else {
      setDevotional(FALLBACK_BREAD);
    }
    setIsGenerating(false);
  };

  const checkAmenStatus = (date: string) => {
    const amenKey = `amen_${date}`;
    if (localStorage.getItem(amenKey)) {
      setHasSaidAmen(true);
    } else {
      setHasSaidAmen(false);
    }
  };

  useEffect(() => {
    loadDevotional();
  }, []);

  const handleAmenClick = async () => {
    if (hasSaidAmen || !devotional) return;

    const amenKey = `amen_${devotional.date}`;
    localStorage.setItem(amenKey, 'true');
    setHasSaidAmen(true);
    setShowAmenToast(true);

    if (currentUser) {
      const prayerNote = {
        bookId: 'devocional',
        chapter: 0,
        content: `🙏 Amém! Recebi a palavra de hoje: "${devotional.title}". \n\nVersículo: ${devotional.verseText} (${devotional.verseReference})`,
      };
      await dbService.add(currentUser.uid, 'notes', prayerNote);
      await earnMana('devotional'); // Gamification
    }

    setTimeout(() => setShowAmenToast(false), 3000);
  };

  const handleAnalyzeReflection = async () => {
    if (!reflection.trim() || !devotional) return;
    
    if (!currentUser) {
      const hasUsedFree = localStorage.getItem('bible_free_gen_used');
      if (hasUsedFree) {
        if (confirm("Você já utilizou sua geração gratuita. Faça login para continuar.")) {
          navigate('/login', { state: { from: location } });
        }
        return;
      }
    } else {
      const canProceed = await deductPoints(3);
      if (!canProceed) {
        if (confirm("Saldo insuficiente para análise. Deseja recarregar suas moedas?")) {
            openBuyCredits();
        }
        return;
      }
    }

    setIsAnalyzing(true);
    const context = `Devocional: ${devotional.title}. Texto: ${devotional.verseText} (${devotional.verseReference}). Lição: ${devotional.content}`;
    
    const feedback = await analyzeUnderstanding(reflection, context);
    
    if (feedback && feedback !== "Erro na análise.") {
      if (!currentUser) localStorage.setItem('bible_free_gen_used', 'true');
      setAiFeedback(feedback);
    } else {
      alert("Erro ao analisar.");
    }
    setIsAnalyzing(false);
  };

  const handleManualSave = async () => {
    if (!devotional || !reflection.trim()) return;
    
    if (!currentUser) {
      if (confirm("Para salvar sua reflexão, faça login. Ir para o login?")) {
        navigate('/login', { state: { from: location } });
      }
      return;
    }

    setIsSaving(true);

    const title = `Reflexão: ${devotional.title}`;
    const sourceText = `${devotional.verseText} (${devotional.verseReference})\n\nConteúdo: ${devotional.content}\n\nOração: ${devotional.prayer}`;
    
    try {
      await dbService.add(currentUser.uid, 'studies', {
        title,
        sourceText,
        userThoughts: reflection,
        analysis: aiFeedback || "Aplicação pessoal salva.",
        source: 'devocional'
      });
      await earnMana('deep_study'); // Gamification for reflection
      setShowSaveToast(true);
      setTimeout(() => {
        setShowSaveToast(false);
        navigate('/meus-estudos');
      }, 2000);
    } catch (e) { console.error(e); }

    setIsSaving(false);
  };

  const startDeepStudy = () => {
    if (!devotional) return;
    const fullText = `${devotional.title}\n\n${devotional.verseText} (${devotional.verseReference})\n\n${devotional.content}`;
    navigate('/estudo', { state: { text: fullText, source: 'devocional' } });
  };

  const handleShare = async () => {
    if (!devotional) return;
    const deepLink = generateShareLink('devotional', { date: devotional.date });
    const shareData = {
      title: devotional.title,
      text: `Pão Diário: ${devotional.title}\n\n"${devotional.verseText}" (${devotional.verseReference})\n\n${devotional.content.substring(0, 100)}...`,
      url: deepLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert("Copiado para a área de transferência!");
    }
  };

  if (isGenerating || !devotional) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black/20">
        <div className="w-full max-w-2xl bg-white dark:bg-bible-darkPaper rounded-2xl shadow-xl overflow-hidden animate-pulse">
           <div className="h-48 bg-gray-200 dark:bg-gray-800" />
           <div className="p-10 space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto" />
              <div className="h-24 bg-gray-100 dark:bg-gray-800/50 rounded" />
              <div className="space-y-3">
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
              </div>
           </div>
        </div>
        <p className="mt-8 text-bible-gold font-medium animate-bounce flex items-center gap-2">
          <Sparkles size={20} /> Preparando o Pão do Dia...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-black/20 relative">
      <div className="p-4 md:p-8 flex flex-col items-center min-h-full">
        
        {showAmenToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-bible-leather text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-bible-gold/30">
              <CheckCircle2 className="text-bible-gold" size={20} />
              <span className="font-medium">Oração registrada!</span>
            </div>
          </div>
        )}

        {showSaveToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-green-400/30">
              <Save className="text-white" size={20} />
              <span className="font-medium">Estudo salvo com sucesso!</span>
            </div>
          </div>
        )}

        <div className="max-w-2xl w-full bg-white dark:bg-bible-darkPaper rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500 mb-8">
          
          <div className="h-48 bg-gradient-to-r from-bible-gold to-yellow-600 flex items-center justify-center text-white relative">
            <Sun size={64} className="opacity-20 absolute top-4 right-4" />
            <button 
              onClick={() => loadDevotional(true)}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-sm"
              title="Pedir novo Pão Diário"
            >
              <RefreshCw size={20} className={isGenerating ? 'animate-spin' : ''} />
            </button>
            <div className="text-center z-10">
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-medium mb-2">
                <Calendar size={14} />
                {devotional.date}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold px-4">Pão Diário</h1>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                 <h2 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold">
                  {devotional.title}
                </h2>
                <button 
                  onClick={startDeepStudy}
                  className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:scale-110 transition-transform"
                  title="Transformar em Estudo Profundo"
                >
                  <Brain size={18} />
                </button>
              </div>
              <div className="h-1 w-20 bg-bible-gold mx-auto rounded-full"></div>
            </div>

            <div className="bg-bible-paper dark:bg-gray-800/50 p-6 rounded-xl border border-bible-gold/20 text-center">
              <p className="font-serif text-lg italic text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                "{devotional.verseText}"
              </p>
              <p className="text-sm font-bold text-bible-leather dark:text-bible-gold uppercase tracking-wider">
                {devotional.verseReference}
              </p>
            </div>

            <div className="prose dark:prose-invert prose-lg mx-auto text-gray-600 dark:text-gray-300 font-sans leading-relaxed text-justify">
              <p>{devotional.content}</p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-xl border-l-4 border-bible-gold italic text-gray-700 dark:text-gray-300">
               <h4 className="font-bold not-italic mb-2 text-bible-gold uppercase text-xs tracking-widest">Oração de hoje</h4>
               <p>"{devotional.prayer}"</p>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <button 
                onClick={() => setShowReflection(!showReflection)}
                className="w-full flex items-center justify-between text-bible-gold hover:text-yellow-600 font-semibold mb-4"
              >
                <span className="flex items-center gap-2"><MessageCircle size={18}/> O que Deus falou com você?</span>
                <span className="text-sm">{showReflection ? 'Fechar' : 'Abrir Reflexão'}</span>
              </button>

              {showReflection && (
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
                  {!aiFeedback ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Escreva sua aplicação pessoal:
                      </label>
                      <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="Ex: Senti que preciso confiar mais em Deus..."
                        className="w-full p-3 rounded-lg border border-purple-200 dark:border-purple-800/30 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none mb-4 min-h-[120px]"
                      />
                      <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button 
                          onClick={handleManualSave}
                          disabled={!reflection.trim() || isSaving}
                          className="flex items-center justify-center gap-2 bg-bible-leather dark:bg-bible-gold text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 text-sm font-bold shadow-md"
                        >
                          {currentUser ? <Save size={16} /> : <Lock size={16} />}
                          {currentUser ? 'Salvar Estudo' : 'Logar p/ Salvar'}
                        </button>
                        <button 
                          onClick={handleAnalyzeReflection}
                          disabled={!reflection.trim() || isAnalyzing}
                          className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-6 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 text-sm font-bold shadow-sm"
                        >
                          {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          {currentUser ? 'Analisar com Pastor IA (3 Moedas)' : 'Analisar Grátis (1ª Vez)'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                          <Sparkles size={18} />
                          Feedback Pastoral
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={handleManualSave}
                            className="text-[10px] font-bold uppercase tracking-wider bg-bible-gold text-white px-3 py-1 rounded-full shadow-sm"
                          >
                            Salvar Tudo
                          </button>
                          <button 
                            onClick={() => { setAiFeedback(null); setReflection(''); }} 
                            className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full border border-gray-200"
                          >
                            Nova Reflexão
                          </button>
                        </div>
                      </div>
                      <div className="prose dark:prose-invert prose-purple prose-sm max-w-none">
                         {aiFeedback.split('\n').map((line, i) => {
                            if (line.startsWith('###')) return <h4 key={i} className="font-bold mt-4 mb-1 text-purple-900 dark:text-purple-100">{line.replace('###', '')}</h4>;
                            return <p key={i} className="mb-2 text-gray-700 dark:text-gray-300">{line}</p>;
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               <button 
                onClick={handleAmenClick}
                disabled={hasSaidAmen}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all duration-300 ${
                  hasSaidAmen 
                    ? 'bg-bible-gold/10 border-bible-gold text-bible-gold font-bold scale-[1.02]' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
               >
                 <Heart size={18} className={`${hasSaidAmen ? 'fill-bible-gold animate-pulse' : ''}`} /> 
                 {hasSaidAmen ? 'Amém!' : 'Amém'}
               </button>
               <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-bible-gold text-white hover:bg-yellow-600 transition-colors shadow-sm font-medium">
                 <Share2 size={18} /> Compartilhar
               </button>
            </div>

          </div>
        </div>

        <button 
          onClick={() => loadDevotional(true)}
          className="flex items-center gap-2 text-gray-400 hover:text-bible-gold text-xs font-bold uppercase tracking-widest transition-colors mb-24"
        >
          <RefreshCw size={14} /> Solicitar novo Pão Diário
        </button>
        
        <div className="h-10 w-full" />

      </div>
    </div>
  );
};

export default Devotional;

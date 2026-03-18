"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect } from 'react';
import { Sun, Calendar, Share2, Heart, Sparkles, Loader2, MessageCircle, Brain, CheckCircle2, RefreshCw, Save, Lock, ArrowLeft, Quote, ChevronRight } from 'lucide-react';

import { DAILY_BREAD as FALLBACK_BREAD } from '../constants';
import { analyzeUnderstanding, generateDailyDevotional } from '../services/pastorAgent';
import { Note, Devotional as DevotionalType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import SEO from '../components/SEO';
import { generateShareLink } from '../utils/shareUtils';
import ConfirmationModal from '../components/ConfirmationModal';

const DevotionalPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, deductPoints, earnMana, openBuyCredits, openLogin } = useAuth();

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

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, variant?: any}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });

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
    if (localStorage.getItem(amenKey)) setHasSaidAmen(true);
    else setHasSaidAmen(false);
  };

  useEffect(() => { loadDevotional(); }, []);

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
      await earnMana('devotional');
    }
    setTimeout(() => setShowAmenToast(false), 3000);
  };

  const handleAnalyzeReflection = async () => {
    if (!reflection.trim() || !devotional) return;
    if (!currentUser) {
        openLogin();
        return;
    } else {
      const canProceed = await deductPoints(3);
      if (!canProceed) {
          openBuyCredits();
          return;
      }
    }

    setIsAnalyzing(true);
    const context = `Devocional: ${devotional.title}. Texto: ${devotional.verseText} (${devotional.verseReference}). Lição: ${devotional.content}`;
    const feedback = await analyzeUnderstanding(reflection, context);
    if (feedback && feedback !== "Erro na análise.") {
      setAiFeedback(feedback);
    } else {
      setModalConfig({
          isOpen: true,
          title: "Erro de Conexão",
          message: "O Obreiro IA não pôde responder agora. Suas moedas não foram debitadas.",
          onConfirm: () => setModalConfig(p => ({...p, isOpen: false})),
          variant: 'danger'
      });
    }
    setIsAnalyzing(false);
  };

  const handleManualSave = async () => {
    if (!devotional || !reflection.trim()) return;
    if (!currentUser) {
        openLogin();
        return;
    }
    setIsSaving(true);
    try {
      await dbService.add(currentUser.uid, 'studies', {
        title: `Reflexão: ${devotional.title}`,
        sourceText: `${devotional.verseText} (${devotional.verseReference})`,
        userThoughts: reflection,
        analysis: aiFeedback || "Aplicação pessoal salva.",
        source: 'devocional'
      });
      await earnMana('deep_study');
      setShowSaveToast(true);
      setTimeout(() => { setShowSaveToast(false); navigate('/meus-estudos'); }, 2000);
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
      text: `🥖 Pão Diário: ${devotional.title}\n\n"${devotional.verseText}" (${devotional.verseReference})\n\n📖 Leia completo em: ${deepLink}`
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.error('Error sharing:', err); }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
      setModalConfig({ isOpen: true, title: "Copiado!", message: "Link de compartilhamento copiado para sua área de transferência.", onConfirm: () => setModalConfig(p => ({...p, isOpen: false})), variant: 'success' });
    }
  };

  if (isGenerating || !devotional) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black/20">
        <Loader2 size={48} className="animate-spin text-bible-gold mb-4" />
        <p className="text-bible-gold font-serif italic animate-pulse">Preparando o Pão do Dia...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-black/20 relative">
      <SEO title={`${devotional.title} - Pão Diário`} description={`Leitura de hoje: ${devotional.verseText} (${devotional.verseReference}).`} />
      <div className="p-4 md:p-8 flex flex-col items-center min-h-full">
        
        {showAmenToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-bible-leather text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-bible-gold/30 font-bold text-sm">
              <CheckCircle2 className="text-bible-gold" size={20} /> Oração registrada!
            </div>
          </div>
        )}

        <div className="max-w-2xl w-full bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-8">
          <div className="h-48 md:h-64 bg-gradient-to-r from-bible-gold to-yellow-600 flex items-center justify-center text-white relative">
            <Sun size={64} className="opacity-20 absolute top-6 right-6" />
            <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-colors"><ArrowLeft size={24}/></button>
            <div className="text-center z-10 px-4">
              <div className="flex items-center justify-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-3"><Calendar size={14} />{devotional.date}</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold px-4 leading-tight">Pão Diário</h1>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-3">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-bible-leather dark:text-bible-gold leading-tight">{devotional.title}</h2>
                <button onClick={startDeepStudy} className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl hover:scale-110 transition-transform shadow-sm" title="Transformar em Estudo Profundo">
                  <Brain size={20} />
                </button>
              </div>
              <div className="h-1.5 w-24 bg-bible-gold/30 mx-auto rounded-full"></div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[2rem] border-2 border-bible-gold/10 text-center shadow-inner group">
              <Quote className="text-bible-gold/20 mx-auto mb-4" size={32} />
              <p className="font-serif text-xl md:text-2xl italic text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">"{devotional.verseText}"</p>
              <div className="flex items-center justify-center gap-3 text-xs font-black text-bible-leather dark:text-bible-gold uppercase tracking-[0.3em]">
                  <div className="h-px w-8 bg-bible-gold/30"></div>
                  {devotional.verseReference}
                  <div className="h-px w-8 bg-bible-gold/30"></div>
              </div>
            </div>

            <div className="prose dark:prose-invert prose-lg mx-auto text-gray-700 dark:text-gray-300 font-sans leading-loose text-justify">
              <p>{devotional.content}</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2rem] border-l-8 border-bible-gold italic text-gray-800 dark:text-gray-200 shadow-sm">
               <h4 className="font-black not-italic mb-3 text-bible-gold uppercase text-[10px] tracking-[0.2em]">Oração de hoje</h4>
               <p className="text-lg leading-relaxed">"{devotional.prayer}"</p>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
              <button onClick={() => setShowReflection(!showReflection)} className="w-full flex items-center justify-between text-bible-leather dark:text-bible-gold font-black uppercase text-[11px] tracking-widest mb-6 px-2 hover:opacity-70 transition-opacity">
                <span className="flex items-center gap-2"><MessageCircle size={18}/> {showReflection ? 'Fechar Reflexão' : 'O que Deus falou com você?'}</span>
                <ChevronRight className={`transition-transform duration-300 ${showReflection ? 'rotate-90' : ''}`} size={16}/>
              </button>

              {showReflection && (
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] p-6 md:p-8 animate-in fade-in slide-in-from-top-4 border border-purple-100 dark:border-purple-900/30">
                  {!aiFeedback ? (
                    <div className="space-y-4">
                      <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Senti que hoje preciso..." className="w-full h-40 p-4 rounded-2xl border-2 border-purple-100 dark:border-purple-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500/30 outline-none text-base resize-none" />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleManualSave} disabled={!reflection.trim() || isSaving} className="flex-1 py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs">
                          {currentUser ? <Save size={18} /> : <Lock size={18} />}{currentUser ? 'Salvar Estudo' : 'Logar p/ Salvar'}
                        </button>
                        <button onClick={handleAnalyzeReflection} disabled={!reflection.trim() || isAnalyzing} className="flex-1 py-4 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-100 dark:border-purple-800 rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs">
                          {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Analisar IA (3 Moedas)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-4">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-black uppercase text-[10px] tracking-widest"><Sparkles size={18} /> Feedback Pastoral IA</div>
                        <div className="flex gap-2">
                           <button onClick={handleManualSave} className="text-[9px] font-black uppercase tracking-widest bg-bible-gold text-white px-4 py-2 rounded-xl shadow-md">Salvar Tudo</button>
                           <button onClick={() => { setAiFeedback(null); setReflection(''); }} className="text-[9px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 text-gray-500 px-4 py-2 rounded-xl border border-gray-200">Resetar</button>
                        </div>
                      </div>
                      <div className="prose dark:prose-invert prose-purple prose-sm max-w-none text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                         {aiFeedback.split('\n').map((line, i) => {
                            if (line.startsWith('###')) return <h4 key={i} className="font-bold mt-6 mb-2 text-bible-leather dark:text-bible-gold uppercase text-xs tracking-wider">{line.replace('###', '')}</h4>;
                            return <p key={i} className="mb-3">{line}</p>;
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               <button onClick={handleAmenClick} disabled={hasSaidAmen} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-[1.5rem] border-2 transition-all duration-300 group ${hasSaidAmen ? 'bg-bible-gold/10 border-bible-gold text-bible-gold font-bold scale-[1.05] shadow-md' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-bible-gold/50'}`}>
                 <Heart size={28} className={`${hasSaidAmen ? 'fill-bible-gold animate-pulse' : 'group-hover:scale-110 transition-transform'}`} /> 
                 <span className="text-[10px] font-black uppercase tracking-widest">{hasSaidAmen ? 'Amém!' : 'Dizer Amém'}</span>
               </button>
               <button onClick={handleShare} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-[1.5rem] bg-bible-leather dark:bg-bible-gold text-white dark:text-black hover:opacity-90 transition-all shadow-xl font-bold active:scale-95">
                 <Share2 size={28} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Compartilhar</span>
               </button>
            </div>
          </div>
        </div>
        <button onClick={() => loadDevotional(true)} className="flex items-center gap-2 text-gray-400 hover:text-bible-gold text-[10px] font-black uppercase tracking-[0.2em] transition-colors mb-24"><RefreshCw size={14} /> Novo Pão Diário</button>
      </div>

      <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(p => ({...p, isOpen: false}))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
      />
    </div>
  );
};

export default DevotionalPage;
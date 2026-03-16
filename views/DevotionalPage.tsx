"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../utils/router';
import { 
  Sun, Calendar, Brain, MessageCircle, 
  Sparkles, Quote, Heart, Share2, RefreshCw, 
  CheckCircle2, Loader2, Save
} from 'lucide-react';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMana } from '../hooks/useMana';
import { generateDailyDevotional } from '../services/geminiService';
import { DAILY_BREAD } from '../constants';
import toast from 'react-hot-toast';

const DevotionalPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const { addMana } = useMana();
  const [loading, setLoading] = useState(true);
  const [devotional, setDevotional] = useState<any>(null);
  const [userReflection, setUserReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [hasSaidAmen, setHasSaidAmen] = useState(false);
  const [showAmenToast, setShowAmenToast] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info' as 'info' | 'danger' | 'success'
  });

  // Normaliza os campos vindos do banco (verse/reference/text)
  // para o formato da IA e constantes (verseText/verseReference/content)
  const normalizeDevotional = (data: any) => {
    if (!data) return null;
    return {
      ...data,
      // A UI usa: verse, reference, text
      verse: data.verse ?? data.verseText ?? '',
      reference: data.reference ?? data.verseReference ?? '',
      text: data.text ?? data.content ?? '',
    };
  };

  const loadDevotional = useCallback(async (forceNew = false) => {
    setLoading(true);
    try {
      let raw = await dbService.getDailyDevotional(forceNew);

      // Fallback: banco vazio -> gera via IA
      if (!raw) {
        try {
          raw = await generateDailyDevotional(forceNew);
        } catch {
          // Se a IA falhar, usa o devocional estático das constantes
          raw = DAILY_BREAD as any;
        }
      }

      const data = normalizeDevotional(raw);
      setDevotional(data);

      if (currentUser && raw?.id) {
        const uid = currentUser.id ?? currentUser.uid;
        const history = await dbService.getUserDevotionalHistory(uid, 1);
        const today = new Date().toISOString().split('T')[0];
        const alreadyDone = history.some((h: any) => h.date === today && h.content_id === raw.id);
        setHasSaidAmen(alreadyDone);
      }
    } catch (error) {
      console.error('Error loading devotional:', error);
      // Último recurso: usa estático mesmo
      setDevotional(normalizeDevotional(DAILY_BREAD as any));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDevotional();
  }, [loadDevotional]);

  const handleAmenClick = async () => {
    if (hasSaidAmen || !currentUser) return;
    
    setIsSaving(true);
    try {
      const uid = currentUser.id ?? currentUser.uid;
      await dbService.saveUserDevotionalAction(uid, devotional.id, 'amen');
      await addMana(10, 'Pão Diário - Amém');
      setHasSaidAmen(true);
      setShowAmenToast(true);
      setTimeout(() => setShowAmenToast(false), 3000);
    } catch (error) {
      toast.error('Erro ao salvar sua ação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!userReflection.trim() || !currentUser) return;
    
    setIsSaving(true);
    try {
      const uid = currentUser.id ?? currentUser.uid;
      await dbService.saveUserDevotionalAction(uid, devotional.id, 'reflection', userReflection);
      toast.success('Reflexão salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar reflexão');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!userReflection.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      // Simulação de análise por IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiAnalysis("Sua reflexão demonstra uma profunda compreensão da aplicação prática deste versículo. A conexão que você fez com os desafios do dia a dia revela um coração disposto a crescer em graça e conhecimento.");
    } catch (error) {
      toast.error('Erro ao processar análise por IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!devotional) return;
    const shareText = `*Pão Diário - BíbliaLM*\n\n"${devotional.verse}"\n- ${devotional.reference}\n\n"${devotional.text}"\n\nQue esta palavra edifique seu dia!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pão Diário - BíbliaLM',
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-bible-gold" size={48} />
          <p className="text-sm font-black uppercase tracking-widest text-gray-400">Preparando seu alimento espiritual...</p>
        </div>
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 p-8 bg-gray-50 dark:bg-black text-center">
        <div className="text-6xl">📖</div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Nenhum Pão Diário disponível</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Ainda não há devocionais cadastrados. Em breve novos conteúdos serão publicados!
        </p>
        <button
          onClick={() => loadDevotional(true)}
          className="flex items-center gap-2 bg-bible-gold text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black selection:bg-bible-gold/30 relative">
      <SEO title="Pão Diário" description="Sua porção diária de sabedoria e reflexão bíblica." />
      
      <div className="p-4 md:p-8 min-h-full">
        {/* Success Toast Overlay */}
        {showAmenToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-bible-gold text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold border-2 border-white/20">
              <CheckCircle2 size={24} />
              <span>Amém! Você recebeu +10 de Maná</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl w-full mx-auto mb-12">
          {/* Main Card */}
          <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Hero Header */}
            <div className="h-56 md:h-80 bg-gradient-to-br from-bible-leather via-[#3d2b25] to-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dimension.png')]"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-bible-gold/10 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-bible-gold/10 rounded-full blur-[100px] animate-pulse"></div>
              
              <div className="text-center z-10 px-6">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 mb-5 animate-in zoom-in slide-in-from-top-4 duration-1000">
                  <Calendar size={14} className="text-bible-gold" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">
                    {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-serif font-black text-white mb-4 drop-shadow-2xl tracking-tighter text-center">
                  Pão <span className="text-bible-gold">Diário</span>
                </h1>
                <div className="w-28 h-1 bg-bible-gold mx-auto rounded-full shadow-[0_0_20px_rgba(197,160,89,0.8)]"></div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content (Left) */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-bible-gold/10 text-bible-gold rounded-2xl shadow-inner">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-bible-gold/60 mb-1">Inspirado pelo Espírito</h3>
                        <p className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-widest">Mensagem do Dia</p>
                      </div>
                    </div>
                    
                    <div className="prose prose-bible dark:prose-invert max-w-none">
                      {/* Versículo */}
                      <div className="mb-10 p-8 md:p-12 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800 relative group transition-all hover:shadow-xl hover:bg-white dark:hover:bg-gray-900 duration-500">
                        <Quote size={48} className="absolute -top-5 -left-5 text-bible-gold opacity-10 group-hover:opacity-20 transition-opacity" />
                        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 leading-snug text-gray-900 dark:text-white group-hover:text-bible-leather dark:group-hover:text-bible-gold transition-colors">
                          "{devotional.verse}"
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="inline-block text-xs font-black text-bible-gold uppercase tracking-[0.3em] bg-bible-gold/10 px-5 py-2.5 rounded-xl border border-bible-gold/20">
                            {devotional.reference}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-bible-gold/20 to-transparent"></div>
                        </div>
                      </div>

                      {/* Parágrafos */}
                      <div className="space-y-6 text-lg leading-[1.9] text-gray-700 dark:text-gray-300 font-serif">
                        {devotional.text.split('\n\n').map((para: string, i: number) => (
                          <p key={i} className="first-letter:text-5xl first-letter:font-black first-letter:text-bible-gold first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reflexão do usuário */}
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => setShowReflection(!showReflection)}
                      className="flex items-center gap-2 text-bible-gold hover:opacity-80 transition-all group"
                    >
                      <div className="p-2 rounded-xl bg-bible-gold/10 group-hover:scale-110 transition-transform">
                        <MessageCircle size={18} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-[0.2em]">{showReflection ? 'Fechar Reflexão' : 'Adicionar Minha Reflexão'}</span>
                    </button>

                    {showReflection && (
                      <div className="mt-5 space-y-4 animate-in slide-in-from-top-4 duration-500">
                        <textarea
                          value={userReflection}
                          onChange={(e) => setUserReflection(e.target.value)}
                          placeholder="O que esta palavra falou ao seu coração hoje?"
                          className="w-full h-36 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent focus:border-bible-gold/30 outline-none transition-all resize-none text-base font-medium"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={handleSaveReflection}
                            disabled={isSaving || !userReflection.trim()}
                            className="flex items-center gap-2 bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-6 py-3 rounded-full font-bold hover:shadow-lg disabled:opacity-50 transition-all text-sm"
                          >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar Reflexão
                          </button>
                          
                          <button 
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing || !userReflection.trim()}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-full font-bold border border-gray-200 dark:border-gray-700 hover:border-bible-gold transition-all text-sm"
                          >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
                            Análise Profunda (IA)
                          </button>
                        </div>

                        {aiAnalysis && (
                          <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 animate-in fade-in duration-700">
                            <h4 className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold mb-2 uppercase text-xs tracking-widest">
                              <Sparkles size={14} /> Insight Espiritual
                            </h4>
                            <p className="text-base text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                              {aiAnalysis}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Oração */}
                  <div className="bg-gradient-to-br from-bible-gold/5 to-bible-gold/15 dark:from-bible-gold/5 dark:to-orange-500/5 p-7 rounded-2xl border border-bible-gold/20 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-bible-gold group-hover:w-2 transition-all"></div>
                    <h4 className="font-black mb-4 text-bible-gold uppercase text-xs tracking-[0.3em] flex items-center gap-2">
                      <Sun size={14} /> Oração do Dia
                    </h4>
                    <p className="text-base font-serif text-gray-700 dark:text-gray-200 leading-[1.75] italic">
                      "{devotional.prayer}"
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleAmenClick} 
                      disabled={hasSaidAmen} 
                      className={`flex flex-col items-center justify-center gap-3 py-7 rounded-2xl border-2 transition-all duration-500 group relative overflow-hidden ${
                        hasSaidAmen 
                          ? 'bg-bible-gold/10 border-bible-gold text-bible-gold scale-[1.02] shadow-lg' 
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-bible-gold/50 hover:bg-bible-gold/5'}`}
                    >
                      <Heart size={28} className={`${hasSaidAmen ? 'fill-bible-gold scale-110' : 'group-hover:scale-125 transition-transform'}`} /> 
                      <span className="text-xs font-black uppercase tracking-widest">{hasSaidAmen ? 'Amém!' : 'Dizer Amém'}</span>
                      {hasSaidAmen && <span className="absolute top-2 right-3 text-[9px] bg-bible-gold text-white px-1.5 py-0.5 rounded-full">+10</span>}
                    </button>

                    <button 
                      onClick={handleShare} 
                      className="flex flex-col items-center justify-center gap-3 py-7 rounded-2xl bg-bible-leather dark:bg-bible-gold text-white dark:text-black hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all shadow font-bold"
                    >
                      <Share2 size={28} />
                      <span className="text-xs font-black uppercase tracking-widest">Compartilhar</span>
                    </button>
                  </div>

                  {/* Novo */}
                  <button 
                    onClick={() => loadDevotional(true)} 
                    className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-bible-gold text-[10px] font-black uppercase tracking-[0.3em] transition-all bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-transparent hover:border-bible-gold/20 group"
                  >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" /> 
                    Novo Pão Diário
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

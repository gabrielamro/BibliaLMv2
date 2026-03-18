"use client";
import { useNavigate, useSearchParams, useLocation } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { generateBibleQuiz } from '../services/pastorAgent';
import { dbService } from '../services/supabase';
import { QuizQuestion, CustomQuiz } from '../types';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Brain, Trophy, Zap, ChevronRight, Play, Crown, X, Scroll, Fish, Flame, Lightbulb, Map, Heart, Swords, Lock, User, Share2, Clock, LogIn, Info, ArrowRight, Sparkles, Rss, Dices } from 'lucide-react';
import SEO from '../components/SEO';
import GamificationShare from '../components/GamificationShare';
import ConfirmationModal from '../components/ConfirmationModal';

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <Brain className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            A Arena de Sabedoria está sendo preparada para os maiores desafios.
        </p>
    </div>
);

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const quizId = searchParams.get('id');
  const state = location.state as { initialTopic?: string };
  
  const { currentUser, userProfile, recordActivity, openLogin } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  
  const [view, setView] = useState<'menu' | 'journey_map' | 'topic_select' | 'ranked_setup' | 'loading' | 'game' | 'result' | 'external_start'>('menu');
  
  if (!isFeatureEnabled('module_quiz')) {
      return <FeatureDisabled />;
  }

  const [gameMode, setGameMode] = useState<'classic' | 'journey' | 'ranked' | 'custom'>('classic');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [topic, setTopic] = useState('');
  const [customQuizData, setCustomQuizData] = useState<CustomQuiz | null>(null);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const timerRef = useRef<any>(null);

  // Load Custom Quiz if ID provided
  useEffect(() => {
      const loadCustomQuiz = async () => {
          if (quizId) {
              setView('loading');
              try {
                  const quiz = await dbService.getCustomQuiz(quizId);
                  if (quiz) {
                      setCustomQuizData(quiz);
                      // Instead of starting immediately, go to a "Lobby" view
                      setView('external_start');
                  } else {
                      alert("Quiz não encontrado ou removido.");
                      navigate('/quiz');
                  }
              } catch (e) {
                  console.error(e);
                  navigate('/quiz');
              }
          }
      };
      if (quizId) loadCustomQuiz();
  }, [quizId, navigate]);

  // Handle Initial Topic from Obreiro/Studio
  useEffect(() => {
    if (state?.initialTopic && !quizId) {
        setTopic(state.initialTopic);
        setGameMode('classic');
        // If it's a specific verse or short topic, we can try to start immediately or let them pick difficulty
        // For now, let's keep them in a "Ready to start" state or topic select
        setView('topic_select'); 
    }
  }, [state, quizId]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleCheck(null); // Time out
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, timerActive]);

  const startCustomGame = async () => {
      if (!customQuizData) return;

      setGameMode('custom');
      setTopic(customQuizData.title);
      setView('loading');

      if (customQuizData.type === 'manual' && customQuizData.questions) {
          setQuestions(customQuizData.questions);
          setLives(customQuizData.gameMode === 'infinite' ? 3 : 999);
          setTimeLeft(20);
          setCurrentQIndex(0);
          setScore(0);
          setView('game');
          setTimerActive(true);
      } else if (customQuizData.type === 'ai_generated' && customQuizData.aiConfig) {
          setDifficulty(customQuizData.aiConfig.difficulty);
          startGame('custom', customQuizData.aiConfig.theme, customQuizData.aiConfig.difficulty, customQuizData.gameMode);
      }
  };

  const startGame = async (mode: any, selectedTopic: string, diff: any, customGameMode?: 'classic' | 'infinite') => {
    setGameMode(mode);
    setTopic(selectedTopic);
    setDifficulty(diff);
    setView('loading');
    
    // Determine lives based on mode
    const initialLives = (mode === 'ranked' || customGameMode === 'infinite') ? 3 : 999;
    
    try {
        const generated = await generateBibleQuiz(selectedTopic, diff);
        if (generated && generated.length > 0) {
            setQuestions(generated);
            setCurrentQIndex(0);
            setScore(0);
            setLives(initialLives);
            setTimeLeft(diff === 'hard' ? 10 : 15);
            setView('game');
            setTimerActive(true);
        } else {
            setView('menu');
            alert("Não foi possível gerar questões sobre este tema.");
        }
    } catch (e) {
        setView('menu');
    }
  };

  const handleCheck = (idx: number | null) => {
    if (isChecked) return;
    setTimerActive(false);
    setSelectedOption(idx);
    setIsChecked(true);

    const isCorrect = idx === questions[currentQIndex].correctIndex;
    if (isCorrect) {
        setScore(prev => prev + (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30));
    } else {
        const isInfinite = gameMode === 'ranked' || (customQuizData?.gameMode === 'infinite');
        if (isInfinite) {
            setLives(prev => prev - 1);
        }
    }
  };

  const handleNext = async () => {
    const isInfinite = gameMode === 'ranked' || (customQuizData?.gameMode === 'infinite');
    
    // 1. Verifica se perdeu todas as vidas
    if (isInfinite && lives <= 0) {
        finishGame();
        return;
    }
    
    // 2. Verifica se chegou ao fim da lista de perguntas atual
    if (currentQIndex === questions.length - 1) {
        if (isInfinite && (gameMode === 'ranked' || customQuizData?.type === 'ai_generated')) {
            // MODO INFINITO IA: Carrega mais perguntas
            setIsLoadingMore(true);
            try {
                const nextBatch = await generateBibleQuiz(topic, difficulty);
                if (nextBatch && nextBatch.length > 0) {
                    setQuestions(prev => [...prev, ...nextBatch]);
                    proceedToNextQuestion(); 
                } else {
                    finishGame();
                }
            } catch (e) {
                finishGame();
            } finally {
                setIsLoadingMore(false);
            }
            return;
        } else {
            // Modos Clássico/Manual acabam quando a lista acaba
            finishGame();
            return;
        }
    }

    proceedToNextQuestion();
  };

  const proceedToNextQuestion = () => {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setTimeLeft(difficulty === 'hard' ? 10 : 15);
      setTimerActive(true);
  };

  const finishGame = async () => {
    setView('loading');
    let gained = Math.round(score / 5); 
    if (lives > 0 && gameMode !== 'ranked') gained += 20; 
    
    setXpGained(gained);
    if (currentUser) {
        await recordActivity('quiz_completion', `Quiz: ${topic}`, { xpGained: gained });
        if (gameMode === 'ranked') {
            const currentHigh = userProfile?.stats?.rankedHighScore || 0;
            if (score > currentHigh) {
                await dbService.updateUserProfile(currentUser.uid, { 'stats.rankedHighScore': score } as any);
            }
        }
    }
    setView('result');
  };

  const openRankedSetup = () => {
    if (!currentUser) { openLogin('/quiz'); return; }
    setView('ranked_setup');
  };

  const handlePostToFeed = () => {
      if (!currentUser) { openLogin(); return; }
      navigate('/social', { 
          state: { 
              openCreate: 'quiz', 
              quizData: { 
                  topic, 
                  score, 
                  xp: xpGained 
              } 
          } 
      });
  };

  if (view === 'loading') return (
    <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-bible-darkPaper">
        <Loader2 className="animate-spin text-bible-gold mb-4" size={48} />
        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white animate-pulse">Preparando Desafio...</h2>
    </div>
  );

  if (view === 'external_start' && customQuizData) {
      return (
          <div className="h-full bg-gray-50 dark:bg-black/20 p-4 md:p-8 flex flex-col items-center justify-center animate-in fade-in">
              <div className="max-w-md w-full bg-white dark:bg-bible-darkPaper rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  
                  <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-purple-600 dark:text-purple-400">
                      <Dices size={48} />
                  </div>
                  
                  <div className="mb-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          Sala de Jogo
                      </span>
                      <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mt-4 mb-2">
                          {customQuizData.title}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                          {customQuizData.description || "Prepare-se para testar seus conhecimentos bíblicos neste desafio personalizado."}
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Modo</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                              {customQuizData.gameMode === 'infinite' ? 'Sobrevivência' : 'Clássico'}
                          </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                           <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Tipo</span>
                           <span className="text-sm font-black text-gray-900 dark:text-white">
                               {customQuizData.type === 'ai_generated' ? 'Gerado por IA' : 'Manual'}
                           </span>
                      </div>
                  </div>

                  <button 
                      onClick={startCustomGame}
                      className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                      <Play size={20} fill="currentColor" /> Começar Desafio
                  </button>
                  
                  <button onClick={() => navigate('/quiz')} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600">
                      Voltar ao Menu
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'game') {
    const q = questions[currentQIndex];
    const isInfinite = gameMode === 'ranked' || (customQuizData?.gameMode === 'infinite');

    return (
      <div className="h-full bg-gray-50 dark:bg-black/20 p-4 md:p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
        <div className="max-w-2xl w-full bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 overflow-hidden relative">
            
            {/* Loader de Infinite Scroll entre batches */}
            {isLoadingMore && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in">
                    <Loader2 className="animate-spin text-bible-gold mb-2" size={40} />
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Preparando próximo nível...</p>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        {isInfinite ? `Questão ${currentQIndex + 1}` : `Questão ${currentQIndex + 1}/${questions.length}`}
                    </span>
                    {isInfinite && (
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <Heart key={i} size={14} className={i < lives ? "text-red-500 fill-red-500" : "text-gray-200"} />
                            ))}
                        </div>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center font-black ${timeLeft < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-bible-gold text-bible-gold'}`}>
                    {timeLeft}
                </div>
            </div>

            <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
                {q.question}
            </h2>

            <div className="space-y-3 mb-8">
                {q.options.map((opt, i) => {
                    let style = "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300";
                    if (isChecked) {
                        if (i === q.correctIndex) style = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 scale-[1.02]";
                        else if (i === selectedOption) style = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400";
                    } else if (i === selectedOption) {
                        style = "border-bible-gold bg-bible-gold/5 text-bible-leather dark:text-bible-gold";
                    }

                    return (
                        <button 
                            key={i} 
                            disabled={isChecked}
                            onClick={() => handleCheck(i)}
                            className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center gap-4 ${style}`}
                        >
                            <span className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0 uppercase">{String.fromCharCode(65 + i)}</span>
                            {opt}
                        </button>
                    );
                })}
            </div>

            {isChecked && (
                <div className="animate-in slide-in-from-bottom-4 duration-300 bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3 mb-4">
                        <Info size={18} className="text-bible-gold shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{q.explanation}"</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-bible-gold uppercase tracking-[0.2em]">{q.reference}</span>
                        <button onClick={handleNext} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2">
                            {!isInfinite && currentQIndex === questions.length - 1 ? 'Finalizar' : (lives <= 0 ? 'Ver Resultado' : 'Próxima')} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (view === 'result') return (
    <div className="h-full bg-gray-50 dark:bg-black/20 p-4 md:p-8 flex flex-col items-center justify-center animate-in zoom-in-95">
        <div className="max-w-md w-full bg-white dark:bg-bible-darkPaper rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-yellow-600 shadow-xl shadow-yellow-500/10">
                <Trophy size={48} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">Desafio Concluído</h2>
            <p className="text-gray-500 mb-8 uppercase text-[10px] font-black tracking-[0.2em]">{topic}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <span className="block text-3xl font-black text-gray-900 dark:text-white">{score}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pontos</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-3xl border border-purple-100 dark:border-purple-800">
                    <span className="block text-3xl font-black text-purple-600">+{xpGained}</span>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Maná (XP)</span>
                </div>
            </div>

            <div className="space-y-3">
                <button onClick={handlePostToFeed} className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all">
                    <Rss size={18} /> Postar no Feed
                </button>
                <button onClick={() => setShowShareModal(true)} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Share2 size={18} /> Compartilhar Externo
                </button>
                <button onClick={() => { setView('menu'); navigate('/quiz'); }} className="w-full py-2 text-gray-400 text-xs font-bold hover:text-bible-gold transition-colors">Voltar ao Menu</button>
            </div>
        </div>
        {userProfile && <GamificationShare isOpen={showShareModal} onClose={() => setShowShareModal(false)} userProfile={userProfile} streak={userProfile.stats?.daysStreak || 0} />}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <SEO title="Quiz Bíblico - Desafio da Sabedoria" />
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        
        {view === 'menu' && (
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 shadow-sm transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold">Desafio da Sabedoria</h1>
                    <p className="text-sm text-gray-500">Treine sua mente e espírito.</p>
                </div>
            </div>
        )}

        {view === 'menu' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                <div onClick={() => setView('journey_map')} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-purple-500 hover:shadow-xl transition-all group flex flex-col items-center text-center">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Map size={32} /></div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Jornada do Sábio</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">Siga o mapa bíblico e complete níveis de dificuldade crescente.</p>
                </div>

                <div onClick={openRankedSetup} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-orange-500 hover:shadow-xl transition-all group flex flex-col items-center text-center relative overflow-hidden">
                    {!currentUser && (
                        <div className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-400">
                            <Lock size={16} />
                        </div>
                    )}
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Swords size={32} /></div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Arena Rankeada</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">Valendo pontos no ranking mundial e bônus de Maná. Infinito enquanto tiver vidas.</p>
                </div>

                <div onClick={() => setView('topic_select')} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-bible-gold hover:shadow-xl transition-all group flex flex-col items-center text-center">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Scroll size={32} /></div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Estudo Livre</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">Escolha um tema ou livro específico para treinar sua mente.</p>
                </div>
            </div>
        )}

        {view === 'journey_map' && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
                <button onClick={() => setView('menu')} className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-bible-gold transition-colors"><ArrowLeft size={16} /> Voltar ao Menu</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { id: 'herois', title: 'Heróis da Fé', icon: <Swords/>, diff: 'easy', color: 'bg-green-50 text-green-700' },
                        { id: 'jesus', title: 'Vida de Jesus', icon: <Heart/>, diff: 'easy', color: 'bg-red-50 text-red-700' },
                        { id: 'parabolas', title: 'Parábolas', icon: <Lightbulb/>, diff: 'medium', color: 'bg-blue-50 text-blue-700' },
                        { id: 'profetas', title: 'Grandes Profetas', icon: <Flame/>, diff: 'hard', color: 'bg-orange-50 text-orange-700' }
                    ].map(j => (
                        <div key={j.id} onClick={() => startGame('journey', j.title, j.diff)} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${j.color}`}>{j.icon}</div>
                                <div><h4 className="font-bold text-gray-900 dark:text-white">{j.title}</h4><span className="text-[10px] font-black uppercase tracking-widest opacity-50">{j.diff}</span></div>
                            </div>
                            <Play size={20} className="text-gray-300" fill="currentColor" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {view === 'topic_select' && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
                <button onClick={() => setView('menu')} className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-bible-gold transition-colors"><ArrowLeft size={16} /> Voltar ao Menu</button>
                <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-xl mb-6 text-gray-900 dark:text-white">Sobre o que deseja ser testado?</h3>
                    <div className="space-y-6">
                        <div className="relative">
                            <input type="text" placeholder="Ex: Livro de Gênesis, Milagres, Família..." value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold text-gray-900 dark:text-white shadow-inner" />
                            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-bible-gold opacity-50" size={20} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {['easy', 'medium', 'hard'].map(d => (
                                <button key={d} onClick={() => setDifficulty(d as any)} className={`py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${difficulty === d ? 'bg-bible-gold text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'}`}>{d}</button>
                            ))}
                        </div>
                        <button onClick={() => startGame('classic', topic || 'Conhecimentos Gerais', difficulty)} disabled={!topic} className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-30 active:scale-[0.98]">
                            Começar Treino <Zap size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {view === 'ranked_setup' && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
                <button onClick={() => setView('menu')} className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-bible-gold transition-colors"><ArrowLeft size={16} /> Voltar ao Menu</button>
                <div className="bg-white dark:bg-bible-darkPaper p-10 rounded-[2.5rem] shadow-xl border-2 border-orange-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12"><Swords size={120} /></div>
                    <div className="text-center relative z-10">
                        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">Arena Rankeada</h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Questões infinitas. O jogo só acaba quando suas 3 vidas terminarem.</p>
                        
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-800 mb-10 text-left space-y-4">
                            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-bold text-sm"><CheckCircle2 size={18}/> Modo Sobrevivência (Infinito)</div>
                            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-bold text-sm"><CheckCircle2 size={18}/> 3 Vidas (Errou, perde uma)</div>
                            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-bold text-sm"><CheckCircle2 size={18}/> Pontuação Global</div>
                        </div>

                        <button onClick={() => startGame('ranked', 'Conhecimentos Gerais', 'medium')} className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95">
                            Entrar na Arena <ArrowRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
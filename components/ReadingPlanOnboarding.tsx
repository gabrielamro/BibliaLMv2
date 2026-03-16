"use client";


import React, { useState } from 'react';
import { CalendarRange, Sparkles, ArrowRight, BookOpen, Scroll, Cross, MessageCircle, Loader2, Target, Zap, Clock, CheckCircle2, Bookmark, ShieldCheck, Map, Search, ArrowLeft } from 'lucide-react';
import { PlanScope } from '../types';
import { analyzeReadingPlanCommitment, suggestReadingPlan } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ReadingPlanOnboardingProps {
  onStart: (startToday: boolean, scope: PlanScope, customDays?: number) => void;
}

const ReadingPlanOnboarding: React.FC<ReadingPlanOnboardingProps> = ({ onStart }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedScope, setSelectedScope] = useState<PlanScope>('all');
  const [days, setDays] = useState<string>('');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  
  // Analysis State
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<{ commitment: string; tips: string; difficulty: string; versesPerDay: number; strategy: string } | null>(null);

  // --- HANDLERS ---

  const handleSelectPreset = (scope: PlanScope, duration: number) => {
      setSelectedScope(scope);
      setDays(duration.toString());
      // Vai para a etapa de análise (não cria direto)
      triggerAnalysis(scope, duration);
  };

  const handleManualNext = () => {
      if (!days || parseInt(days) <= 0) {
          alert("Por favor, digite um número válido de dias.");
          return;
      }
      triggerAnalysis(selectedScope, parseInt(days));
  };

  const handleAiSuggest = async () => {
      if (!aiPrompt.trim()) return;
      setIsAiSuggesting(true);
      try {
          const result = await suggestReadingPlan(aiPrompt);
          if (result && result.scope && result.days) {
              setSelectedScope(result.scope as PlanScope);
              setDays(result.days.toString());
              triggerAnalysis(result.scope as PlanScope, result.days);
          } else {
              // Fallback simples se a IA não entender
              alert("Não consegui entender o plano exato. Tente algo como 'Novo Testamento em 6 meses' ou configure manualmente.");
          }
      } catch (e) {
          console.error(e);
          alert("Erro ao consultar IA. Tente configurar manualmente.");
      } finally {
          setIsAiSuggesting(false);
      }
  };

  const triggerAnalysis = async (scope: PlanScope, duration: number) => {
      setStep(3); // Vai para tela de análise
      setIsLoadingAnalysis(true);
      
      let result = null;
      try {
          result = await analyzeReadingPlanCommitment(duration, scope);
      } catch (e) {
          console.error("AI Analysis failed", e);
      }

      // Fallback Robusto (Matemático) caso a IA falhe ou timeout
      if (!result) {
          const totalChapters = scope === 'all' ? 1189 : scope === 'new_testament' ? 260 : 929;
          const chaptersPerDay = totalChapters / duration;
          const versesPerDay = Math.ceil(chaptersPerDay * 26); // Média aprox.
          
          let difficulty = 'Moderado';
          if (chaptersPerDay > 4) difficulty = 'Intenso';
          if (chaptersPerDay < 1) difficulty = 'Leve';

          result = {
              commitment: "Aceito o desafio de crescer no conhecimento da Graça e da Verdade.",
              tips: "1. Defina um horário fixo.\n2. Ore antes de ler.\n3. Não desista se atrasar um dia.",
              difficulty: difficulty,
              versesPerDay: versesPerDay,
              strategy: `Leitura sequencial de aprox. ${chaptersPerDay.toFixed(1)} capítulos por dia.`
          };
      }

      setAnalysis(result);
      setIsLoadingAnalysis(false);
  };

  const getScopeName = () => {
    if (selectedScope === 'all') return 'Bíblia Completa';
    if (selectedScope === 'new_testament') return 'Novo Testamento';
    return 'Antigo Testamento';
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 dark:bg-black/20">
      <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 animate-in fade-in duration-500">
        
        <div className="max-w-xl w-full bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 my-auto">
          
          <div className="bg-gradient-to-br from-bible-gold to-yellow-600 p-8 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/30">
                   {step === 3 ? <Target size={32} className="text-white" /> : <Sparkles size={32} className="text-white" />}
                </div>
                <h1 className="text-2xl font-serif font-bold mb-1">
                    {step === 3 ? 'Confirmar Meta' : 'Configurador de Meta'}
                </h1>
                <p className="text-white/80 text-xs uppercase tracking-widest font-bold">
                    {step === 3 ? 'Revise antes de começar' : 'Defina seu ritmo de leitura'}
                </p>
             </div>
          </div>

          <div className="p-6 md:p-10">
             
             {/* --- STEP 1: LANDING CONFIGURATOR --- */}
             {step === 1 && (
               <div className="space-y-8 animate-in slide-in-from-right-4">
                  
                  {/* AI Input Section */}
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                      <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2 block flex items-center gap-2">
                          <Sparkles size={14} /> Personal Trainer IA
                      </label>
                      <div className="relative">
                          <input 
                            type="text" 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
                            placeholder="Ex: Ler Salmos em 30 dias..."
                            className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                          <button 
                            onClick={handleAiSuggest}
                            disabled={!aiPrompt.trim() || isAiSuggesting}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                              {isAiSuggesting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          </button>
                      </div>
                  </div>

                  {/* Presets Grid */}
                  <div>
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 px-1">Sugestões Prontas</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button onClick={() => handleSelectPreset('all', 365)} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-bible-gold hover:shadow-md transition-all text-left group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg group-hover:scale-110 transition-transform"><BookOpen size={18}/></div>
                                  <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Bíblia Anual</span>
                              </div>
                              <p className="text-xs text-gray-500">Todo o texto sagrado em 365 dias.</p>
                          </button>

                          <button onClick={() => handleSelectPreset('new_testament', 180)} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-bible-gold hover:shadow-md transition-all text-left group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Cross size={18}/></div>
                                  <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Novo Testamento</span>
                              </div>
                              <p className="text-xs text-gray-500">Foco em Jesus e na Igreja (6 meses).</p>
                          </button>

                          <button onClick={() => handleSelectPreset('old_testament', 365)} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-bible-gold hover:shadow-md transition-all text-left group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg group-hover:scale-110 transition-transform"><Scroll size={18}/></div>
                                  <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Antigo Testamento</span>
                              </div>
                              <p className="text-xs text-gray-500">História e Profecia em 1 ano.</p>
                          </button>

                          <button onClick={() => handleSelectPreset('new_testament', 90)} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-bible-gold hover:shadow-md transition-all text-left group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg group-hover:scale-110 transition-transform"><Zap size={18}/></div>
                                  <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">NT Intensivo</span>
                              </div>
                              <p className="text-xs text-gray-500">Desafio de 3 meses (90 dias).</p>
                          </button>
                      </div>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => setStep(2)} className="text-sm font-bold text-gray-400 hover:text-bible-gold transition-colors">
                          Configurar Manualmente
                      </button>
                  </div>
               </div>
             )}

             {/* --- STEP 2: MANUAL CONFIG --- */}
             {step === 2 && (
               <div className="space-y-6 animate-in slide-in-from-right-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center">Configuração Manual</h3>
                  
                  {/* Escopo */}
                  <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase">1. O que vamos ler?</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'all', label: 'Bíblia Completa', desc: '1189 capítulos' },
                          { id: 'new_testament', label: 'Novo Testamento', desc: '260 capítulos' },
                          { id: 'old_testament', label: 'Antigo Testamento', desc: '929 capítulos' }
                        ].map(scope => (
                          <button key={scope.id} onClick={() => setSelectedScope(scope.id as PlanScope)} className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedScope === scope.id ? 'border-bible-gold bg-bible-gold/5' : 'border-gray-100 dark:border-gray-800'}`}>
                              <div className="text-left">
                                  <span className="font-bold text-sm block text-gray-800 dark:text-gray-200">{scope.label}</span>
                                  <span className="text-xs text-gray-500">{scope.desc}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 ${selectedScope === scope.id ? 'border-bible-gold bg-bible-gold' : 'border-gray-300'}`}></div>
                          </button>
                        ))}
                      </div>
                  </div>

                  {/* Tempo */}
                  <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase">2. Em quantos dias?</label>
                      <input 
                          type="number" 
                          value={days} 
                          onChange={(e) => setDays(e.target.value)} 
                          placeholder="Ex: 365" 
                          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold font-bold text-center text-lg" 
                      />
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold text-sm">Voltar</button>
                      <button onClick={handleManualNext} className="flex-1 py-3 bg-bible-gold text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                          Analisar Plano <ArrowRight size={16} />
                      </button>
                  </div>
               </div>
             )}

             {/* --- STEP 3: ANALYSIS & CONFIRMATION --- */}
             {step === 3 && (
               <div className="space-y-6 animate-in slide-in-from-right-4">
                  {isLoadingAnalysis ? (
                      <div className="text-center py-10">
                          <Loader2 size={48} className="animate-spin text-bible-gold mx-auto mb-4" />
                          <h3 className="font-bold text-gray-800 dark:text-white">Calculando Rota...</h3>
                          <p className="text-sm text-gray-500">O Obreiro IA está organizando sua leitura.</p>
                      </div>
                  ) : analysis ? (
                      <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Resumo da Meta</h2>
                            <p className="text-sm text-gray-500">{getScopeName()} em {days} dias</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl border border-purple-100 dark:border-purple-800/30 text-center">
                                <Zap size={16} className="text-purple-600 mx-auto mb-1" />
                                <span className="block text-[8px] font-black text-purple-400 uppercase">Nível</span>
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{analysis.difficulty}</span>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center">
                                <Clock size={16} className="text-blue-600 mx-auto mb-1" />
                                <span className="block text-[8px] font-black text-blue-400 uppercase">Caps/Dia</span>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{(analysis.versesPerDay / 26).toFixed(1)}</span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-800/30 text-center">
                                <Bookmark size={16} className="text-green-600 mx-auto mb-1" />
                                <span className="block text-[8px] font-black text-green-400 uppercase">Verses</span>
                                <span className="text-xs font-bold text-green-700 dark:text-green-300">~{analysis.versesPerDay}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-black text-bible-gold uppercase tracking-widest mb-3 flex items-center gap-2"><Map size={14} /> Estratégia:</h4>
                            <p className="text-sm font-bold text-gray-800 dark:text-white mb-4">{analysis.strategy}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">"{analysis.commitment}"</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => onStart(true, selectedScope, parseInt(days))} 
                                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                            >
                                Confirmar e Iniciar <CheckCircle2 size={20} />
                            </button>
                            <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                <ArrowLeft size={12}/> Voltar para Escolha
                            </button>
                        </div>
                      </>
                  ) : null}
               </div>
             )}

          </div>
        </div>
        <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 font-bold opacity-50"><ShieldCheck size={16} /> SINCRONIZADO NO REINO</div>
      </div>
    </div>
  );
};

export default ReadingPlanOnboarding;

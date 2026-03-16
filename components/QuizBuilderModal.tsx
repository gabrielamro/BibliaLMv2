"use client";

import React, { useState } from 'react';
import { X, Save, Brain, FileText, Check, Plus, Trash2, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { CustomQuiz, QuizQuestion } from '../types';

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CustomQuiz, 'id' | 'authorId' | 'createdAt' | 'isActive'>) => void;
}

const QuizBuilderModal: React.FC<QuizBuilderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [gameMode, setGameMode] = useState<'classic' | 'infinite'>('classic');

  // AI Config
  const [aiTheme, setAiTheme] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(10);

  // Manual Config
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [manualQText, setManualQText] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState(0);
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualReference, setManualReference] = useState('');

  if (!isOpen) return null;

  const handleAddManualQuestion = () => {
      if (!manualQText || manualOptions.some(o => !o.trim())) return;
      const newQ: QuizQuestion = {
          id: Date.now(),
          question: manualQText,
          options: [...manualOptions],
          correctIndex: manualCorrect,
          explanation: manualExplanation || 'Resposta correta.',
          reference: manualReference || 'Bíblia'
      };
      setQuestions([...questions, newQ]);
      setManualQText('');
      setManualOptions(['','','','']);
      setManualCorrect(0);
      setManualExplanation('');
      setManualReference('');
  };

  const handleSaveQuiz = () => {
      if (!title) return;
      
      const quizData: any = {
          title,
          description,
          type: mode === 'ai' ? 'ai_generated' : 'manual',
          gameMode
      };

      if (mode === 'ai') {
          if (!aiTheme) return;
          quizData.aiConfig = {
              theme: aiTheme,
              difficulty: aiDifficulty,
              questionCount: gameMode === 'infinite' ? 0 : aiCount
          };
      } else {
          if (questions.length === 0) return;
          quizData.questions = questions;
      }

      onSave(quizData);
      onClose();
  };

  const canProceedToStep2 = title.trim().length > 0;
  const canProceedToStep3 = true; // Mode and gameMode always have defaults
  const canSave = mode === 'ai' ? aiTheme.trim().length > 0 : questions.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-bible-darkPaper w-full max-w-2xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden">
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">Criar Sala de Jogos</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-bible-gold text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>1</span>
                    <div className={`w-4 h-[2px] ${step >= 2 ? 'bg-bible-gold' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-bible-gold text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>2</span>
                    <div className={`w-4 h-[2px] ${step >= 3 ? 'bg-bible-gold' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-bible-gold text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>3</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                
                {step === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Informações Básicas</h3>
                      <p className="text-sm text-gray-500 mb-6">Dê um nome chamativo para o seu jogo.</p>
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="Título do Quiz (ex: Heróis da Fé)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg outline-none focus:ring-2 ring-bible-gold" />
                        <textarea placeholder="Descrição breve para os participantes..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none resize-none h-32" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Configurações do Jogo</h3>
                      <p className="text-sm text-gray-500 mb-6">Como este jogo vai funcionar?</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Método de Criação</label>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setMode('ai')} className={`p-6 rounded-2xl border-2 text-left transition-all ${mode === 'ai' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'}`}>
                              <Brain size={24} className={mode === 'ai' ? 'text-purple-500' : 'text-gray-400'} />
                              <h4 className={`font-bold mt-4 ${mode === 'ai' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>Gerar com IA</h4>
                              <p className="text-xs text-gray-500 mt-2">A IA cria perguntas infinitas ou limitadas baseadas em um tema.</p>
                          </button>
                          <button onClick={() => setMode('manual')} className={`p-6 rounded-2xl border-2 text-left transition-all ${mode === 'manual' ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-200 dark:border-gray-800 hover:border-yellow-300'}`}>
                              <FileText size={24} className={mode === 'manual' ? 'text-bible-gold' : 'text-gray-400'} />
                              <h4 className={`font-bold mt-4 ${mode === 'manual' ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-700 dark:text-gray-300'}`}>Criar Manualmente</h4>
                              <p className="text-xs text-gray-500 mt-2">Você escreve cada pergunta, opção e resposta correta.</p>
                          </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Modo de Jogo</label>
                      <div className="flex gap-4 items-center">
                          <select value={gameMode} onChange={e => setGameMode(e.target.value as any)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-bible-gold">
                              <option value="classic">Clássico (Pontuação Fixa)</option>
                              <option value="infinite">Infinito (Sobrevivência)</option>
                          </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Conteúdo do Jogo</h3>
                      <p className="text-sm text-gray-500 mb-6">Defina as perguntas ou o tema para a IA.</p>
                    </div>

                    {mode === 'ai' ? (
                        <div className="space-y-6 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-3xl border border-purple-100 dark:border-purple-800/30">
                            <div>
                                <label className="text-[10px] font-black uppercase text-purple-500 mb-2 block tracking-widest">Tema Bíblico</label>
                                <input type="text" value={aiTheme} onChange={e => setAiTheme(e.target.value)} placeholder="Ex: Milagres de Jesus, Reis de Israel..." className="w-full p-4 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-sm outline-none focus:ring-2 ring-purple-500" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase text-purple-500 mb-2 block tracking-widest">Dificuldade</label>
                                    <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value as any)} className="w-full p-4 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-sm outline-none">
                                        <option value="easy">Fácil (Iniciantes)</option>
                                        <option value="medium">Médio (Geral)</option>
                                        <option value="hard">Difícil (Teólogos)</option>
                                    </select>
                                </div>
                                {gameMode !== 'infinite' && (
                                    <div className="w-32">
                                        <label className="text-[10px] font-black uppercase text-purple-500 mb-2 block tracking-widest">Qtd. Perguntas</label>
                                        <input type="number" value={aiCount} onChange={e => setAiCount(parseInt(e.target.value))} className="w-full p-4 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl text-sm outline-none" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                              <Brain size={20} className="text-purple-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">O Obreiro IA gerará perguntas únicas a cada rodada baseadas neste tema, garantindo que o jogo nunca fique repetitivo.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
                                <input type="text" value={manualQText} onChange={e => setManualQText(e.target.value)} placeholder="Pergunta (ex: Quem abriu o Mar Vermelho?)" className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-bible-gold" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {manualOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 ring-bible-gold/50">
                                            <button onClick={() => setManualCorrect(idx)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${manualCorrect === idx ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-green-300'}`}><Check size={14} strokeWidth={4}/></button>
                                            <input type="text" value={opt} onChange={e => { const n = [...manualOptions]; n[idx] = e.target.value; setManualOptions(n); }} placeholder={`Opção ${idx+1}`} className="flex-1 p-2 bg-transparent text-sm outline-none" />
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-3">
                                    <input type="text" value={manualReference} onChange={e => setManualReference(e.target.value)} placeholder="Ref (Ex: Êxodo 14)" className="md:w-1/3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold" />
                                    <input type="text" value={manualExplanation} onChange={e => setManualExplanation(e.target.value)} placeholder="Explicação breve..." className="flex-1 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold" />
                                </div>

                                <button onClick={handleAddManualQuestion} className="w-full py-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                  <Plus size={16} /> Adicionar Pergunta
                                </button>
                            </div>

                            {questions.length > 0 && (
                              <div className="space-y-3">
                                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Questões Adicionadas ({questions.length})</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl flex justify-between items-center text-sm group">
                                            <span className="truncate flex-1 font-medium text-gray-700 dark:text-gray-300">{idx+1}. {q.question}</span>
                                            <button onClick={() => setQuestions(prev => prev.filter(x => x.id !== q.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                  </div>
                              </div>
                            )}
                        </div>
                    )}
                  </div>
                )}

            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex justify-between items-center">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar
                  </button>
                ) : (
                  <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                )}

                {step < 3 ? (
                  <button 
                    onClick={() => setStep(step + 1)} 
                    disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Próximo <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveQuiz} 
                    disabled={!canSave}
                    className="px-8 py-3 bg-bible-gold text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Save size={18} /> Salvar Jogo
                  </button>
                )}
            </div>

        </div>
    </div>
  );
};

export default QuizBuilderModal;
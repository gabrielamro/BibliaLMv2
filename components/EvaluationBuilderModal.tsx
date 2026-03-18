"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Clock, Check, HelpCircle, FileQuestion, AlertCircle, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { StudyEvaluation, StudyQuestion } from '../types';
import { generateBibleQuiz } from '../services/pastorAgent';

interface EvaluationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StudyEvaluation, 'id' | 'planId' | 'authorId' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: StudyEvaluation;
}

const EvaluationBuilderModal: React.FC<EvaluationBuilderModalProps> = ({ 
  isOpen, onClose, onSave, initialData 
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimitMinutes || 0);
  const [questions, setQuestions] = useState<StudyQuestion[]>(initialData?.questions || []);
  const [error, setError] = useState<string | null>(null);

  // AI State
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Question editing state
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  if (!isOpen) return null;

  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
        setError("Digite um tema para a IA.");
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
        // Gera 5 questões de dificuldade média sobre o tema
        const aiQuestions = await generateBibleQuiz(aiTopic, 'medium');
        
        if (aiQuestions && aiQuestions.length > 0) {
            // Mapeia para o formato StudyQuestion
            const newQuestions: StudyQuestion[] = aiQuestions.map((q: any) => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                text: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                points: 10 // Pontuação padrão
            }));

            setQuestions(prev => [...prev, ...newQuestions]);
            setShowAiPanel(false);
            setAiTopic('');
        } else {
            setError("Não foi possível gerar questões sobre este tema. Tente outro.");
        }
    } catch (e) {
        console.error(e);
        setError("Erro ao conectar com o Obreiro IA.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) {
        setError("A pergunta precisa de um texto.");
        return;
    }
    if (newOptions.some(o => !o.trim())) {
        setError("Preencha todas as opções de resposta.");
        return;
    }

    const newQ: StudyQuestion = {
        id: activeQuestionId || Date.now().toString(),
        text: newQuestionText,
        options: [...newOptions],
        correctIndex: correctIndex,
        points: 10 // Default points
    };

    if (activeQuestionId) {
        setQuestions(prev => prev.map(q => q.id === activeQuestionId ? newQ : q));
    } else {
        setQuestions(prev => [...prev, newQ]);
    }

    // Reset Form
    setActiveQuestionId(null);
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setCorrectIndex(0);
    setError(null);
  };

  const handleEditQuestion = (q: StudyQuestion) => {
      setActiveQuestionId(q.id);
      setNewQuestionText(q.text);
      setNewOptions([...q.options]);
      setCorrectIndex(q.correctIndex);
  };

  const handleDeleteQuestion = (id: string) => {
      setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleFinalSave = () => {
      if (!title.trim()) {
          setError("Defina um título para a avaliação.");
          return;
      }
      if (questions.length === 0) {
          setError("Adicione pelo menos uma questão.");
          return;
      }

      onSave({
          title,
          timeLimitMinutes: timeLimit,
          questions
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-3xl">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif flex items-center gap-2">
                    <FileQuestion className="text-bible-gold" /> Editor de Avaliação
                </h2>
                <p className="text-xs text-gray-500">Crie testes para verificar o aprendizado.</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título da Prova</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:ring-2 ring-bible-gold"
                        placeholder="Ex: Prova Final - Gênesis"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Clock size={12}/> Tempo Limite (min)</label>
                    <input 
                        type="number" 
                        value={timeLimit} 
                        onChange={e => setTimeLimit(parseInt(e.target.value))} 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:ring-2 ring-bible-gold"
                        placeholder="0 = Sem tempo"
                    />
                </div>
            </div>

            {/* AI Assistant Toggle */}
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800 overflow-hidden">
                <button 
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="w-full p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                        <Sparkles size={16} /> Assistente de Questões com IA
                    </div>
                    <Wand2 size={16} className={`text-purple-500 transition-transform ${showAiPanel ? 'rotate-90' : ''}`} />
                </button>
                
                {showAiPanel && (
                    <div className="p-4 pt-0 animate-in slide-in-from-top-2">
                        <p className="text-xs text-purple-600/70 dark:text-purple-400 mb-3">
                            Digite um tema bíblico e o Obreiro IA irá gerar 5 questões de múltipla escolha para você revisar.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={aiTopic}
                                onChange={e => setAiTopic(e.target.value)}
                                placeholder="Ex: Vida de Davi, Sermão da Montanha..."
                                className="flex-1 p-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg text-sm outline-none"
                                onKeyDown={e => e.key === 'Enter' && handleGenerateAiQuestions()}
                            />
                            <button 
                                onClick={handleGenerateAiQuestions}
                                disabled={isGenerating || !aiTopic}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                Gerar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Question List */}
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Questões ({questions.length})</h3>
                </div>
                
                {questions.length === 0 && (
                    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        Nenhuma questão adicionada ainda.
                    </div>
                )}

                {questions.map((q, idx) => (
                    <div key={q.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-start group">
                        <div>
                            <span className="text-[10px] font-black text-bible-gold uppercase mb-1 block">Questão {idx + 1}</span>
                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{q.text}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Check size={10} className="text-green-500" /> {q.options[q.correctIndex]}
                            </p>
                        </div>
                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Editar"><Wand2 size={14}/></button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Question Editor */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                    {activeQuestionId ? 'Editar Questão' : 'Adicionar Manualmente'}
                </h4>
                
                <div className="space-y-3">
                    <input 
                        type="text" 
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        placeholder="Digite o enunciado da pergunta..."
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-blue-500"
                    />
                    
                    <div className="space-y-2">
                        {newOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCorrectIndex(idx)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${correctIndex === idx ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-transparent hover:border-green-500'}`}
                                    title="Marcar como correta"
                                >
                                    <Check size={12} strokeWidth={4} />
                                </button>
                                <input 
                                    type="text" 
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...newOptions];
                                        newOpts[idx] = e.target.value;
                                        setNewOptions(newOpts);
                                    }}
                                    placeholder={`Opção ${idx + 1}`}
                                    className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleAddQuestion}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {activeQuestionId ? 'Atualizar Questão' : 'Adicionar Questão'} <Plus size={14} />
                    </button>
                    
                    {error && (
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1 justify-center animate-pulse">
                            <AlertCircle size={12} /> {error}
                        </p>
                    )}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-3xl flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancelar</button>
            <button onClick={handleFinalSave} className="px-8 py-3 bg-bible-gold text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center gap-2">
                <Save size={18} /> Salvar Prova
            </button>
        </div>

      </div>
    </div>
  );
};

export default EvaluationBuilderModal;
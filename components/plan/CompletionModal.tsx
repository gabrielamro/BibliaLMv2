"use client";

import React, { useState } from 'react';
import { CheckCircle2, BookOpen, Sparkles, Loader2, Save } from 'lucide-react';
import { DailyReading, PlanProgress, MoodType } from '../../types';

interface CompletionModalProps {
  isOpen: boolean;
  dailyReading: DailyReading;
  dailyConnection: { theme: string; conclusion: string; } | null;
  localProgress: PlanProgress;
  currentSectionIdx: number;
  onFinish: (mood: MoodType | null, note: string) => void;
}

const moods: { id: MoodType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { id: 'feliz', label: 'Radiante', icon: <span className="text-2xl">😄</span>, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'grato', label: 'Bem', icon: <span className="text-2xl">🙂</span>, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'paz', label: 'Sereno', icon: <span className="text-2xl">😌</span>, color: 'text-teal-600', bg: 'bg-teal-100' },
    { id: 'cansado', label: 'Cansado', icon: <span className="text-2xl">😫</span>, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'ansioso', label: 'Ansioso', icon: <span className="text-2xl">😰</span>, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'triste', label: 'Triste', icon: <span className="text-2xl">😢</span>, color: 'text-gray-600', bg: 'bg-gray-100' },
];

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, dailyReading, dailyConnection, localProgress, currentSectionIdx, onFinish }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const sectionsReadToday = localProgress?.completedSections?.[dailyReading?.day || 0] || [];
  const isLastSection = sectionsReadToday.length === (dailyReading?.readings.length -1);

  const handleFinishClick = async () => {
    setIsSaving(true);
    await onFinish(selectedMood, journalEntry);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-bible-darkPaper flex flex-col animate-in slide-in-from-bottom-full duration-500 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-start p-6 text-center max-w-lg mx-auto w-full pt-12">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLastSection ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
          {isLastSection ? <CheckCircle2 size={32} /> : <BookOpen size={32} />}
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold mb-1">
          {isLastSection ? 'Leitura Diária Concluída!' : 'Seção Finalizada'}
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          {isLastSection 
            ? 'Você completou todo o propósito de hoje.' 
            : 'Ótimo progresso! Registre seus pensamentos antes de continuar.'}
        </p>

        <div className="w-full space-y-6">
           {isLastSection && dailyConnection && (
             <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30 text-left">
               <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300 font-bold">
                 <Sparkles size={18} />
                 <span>Entendimento do Dia (IA)</span>
               </div>
               <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                 "{dailyConnection.conclusion}"
               </p>
             </div>
           )}

           <div>
             <label className="flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
               Como você está se sentindo?
             </label>
             <div className="grid grid-cols-3 gap-3">
                {moods.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
                      selectedMood === m.id 
                      ? `border-bible-gold ${m.bg} scale-105 ring-2 ring-bible-gold/30` 
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                     <div className={`${m.color} p-2 rounded-full`}>{m.icon}</div>
                     <span className={`text-xs font-bold ${selectedMood === m.id ? 'text-gray-800 dark:text-gray-900' : 'text-gray-500'}`}>{m.label}</span>
                  </button>
                ))}
             </div>
           </div>

           <div>
             <textarea
               value={journalEntry}
               onChange={(e) => setJournalEntry(e.target.value)}
               placeholder="Escreva um breve resumo ou oração sobre o que aprendeu hoje..."
               className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-bible-gold outline-none resize-none text-sm"
             />
           </div>

           <button 
             onClick={handleFinishClick}
             disabled={isSaving}
             className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mb-4 hover:opacity-90 transition-opacity"
           >
             {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
             {isSaving ? 'Salvando...' : (isLastSection ? 'Registrar e Finalizar' : 'Salvar e Próxima Leitura')}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;

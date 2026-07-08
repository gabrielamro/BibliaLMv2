"use client";

import React, { useState } from 'react';
import { BatteryLow, BookOpen, CheckCircle2, CloudRain, Heart, Loader2, Save, Smile, Sparkles, Waves, Zap } from 'lucide-react';
import { DailyReading, MoodType, PlanProgress } from '../../types';

interface CompletionModalProps {
  isOpen: boolean;
  dailyReading: DailyReading;
  dailyConnection: { theme: string; conclusion: string; } | null;
  localProgress: PlanProgress;
  currentSectionIdx: number;
  onFinish: (mood: MoodType | null, note: string) => void | Promise<void>;
}

const moods: { id: MoodType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'feliz', label: 'Alegre', icon: <Smile size={22} />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
  { id: 'grato', label: 'Grato', icon: <Heart size={22} />, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20' },
  { id: 'paz', label: 'Em paz', icon: <Waves size={22} />, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/20' },
  { id: 'cansado', label: 'Cansado', icon: <BatteryLow size={22} />, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
  { id: 'ansioso', label: 'Ansioso', icon: <Zap size={22} />, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  { id: 'triste', label: 'Triste', icon: <CloudRain size={22} />, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
];

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, dailyReading, dailyConnection, localProgress, currentSectionIdx, onFinish }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sectionsReadToday = localProgress?.completedSections?.[dailyReading?.day || 0] || [];
  const willCompleteSection = sectionsReadToday.includes(currentSectionIdx) ? sectionsReadToday.length : sectionsReadToday.length + 1;
  const isLastSection = willCompleteSection >= (dailyReading?.readings.length || 0);

  const handleFinishClick = async () => {
    setIsSaving(true);
    await onFinish(selectedMood, journalEntry);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto bg-[#f7f4ed] animate-in slide-in-from-bottom-full duration-500 dark:bg-black">
      <div className="flex min-h-full w-full flex-col items-center justify-start p-4 pt-10 text-center">
        <div className="w-full max-w-lg rounded-[28px] border border-black/5 bg-white p-5 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-bible-darkPaper md:p-7">
        <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl ${isLastSection ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'}`}>
          {isLastSection ? <CheckCircle2 size={32} /> : <BookOpen size={32} />}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-bible-gold">Fechamento da leitura</p>
        <h2 className="mt-2 text-3xl font-serif font-bold text-bible-leather dark:text-bible-gold">
          {isLastSection ? 'Meta diaria concluida' : 'Secao finalizada'}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-gray-500 mb-8 text-sm">
          {isLastSection
            ? 'Registre o que ficou no coracao antes de encerrar a leitura.'
            : 'Guarde uma frase da leitura antes de continuar a jornada.'}
        </p>

        <div className="w-full space-y-6">
          {isLastSection && dailyConnection && (
            <div className="bg-bible-gold/10 p-5 rounded-3xl border border-bible-gold/20 text-left">
              <div className="flex items-center gap-2 mb-2 text-bible-leather dark:text-bible-gold font-bold">
                <Sparkles size={18} />
                <span>Conexao do dia</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "{dailyConnection.conclusion}"
              </p>
            </div>
          )}

          <div>
            <label className="flex items-center justify-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
              Como voce chega ao fim desta leitura?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all ${
                    selectedMood === mood.id
                      ? `border-bible-gold ${mood.bg} scale-[1.03] ring-2 ring-bible-gold/30`
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`${mood.color} rounded-full`}>{mood.icon}</div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <textarea
              value={journalEntry}
              onChange={(event) => setJournalEntry(event.target.value)}
              placeholder="Uma verdade sobre Deus, uma resposta pratica ou uma oracao curta..."
              className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-bible-gold/30 outline-none resize-none text-sm"
            />
          </div>

          <button
            onClick={handleFinishClick}
            disabled={isSaving}
            className="w-full min-h-12 rounded-2xl bg-bible-leather px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-black/10 transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-bible-gold dark:text-black flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : (isLastSection ? 'Registrar e finalizar' : 'Salvar e continuar')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;

"use client";


import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { dbService } from '../services/supabase';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    const success = await dbService.submitBugReport(description, severity);
    setLoading(false);

    if (success) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setDescription('');
        onClose();
      }, 2000);
    } else {
      alert("Erro ao enviar o relatório. Verifique sua conexão.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400 font-bold">
          <AlertTriangle size={24} />
          <h2>Reportar Problema</h2>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-10 text-green-600 animate-in zoom-in">
            <CheckCircle2 size={48} className="mb-2" />
            <p className="font-bold">Relatório enviado!</p>
            <p className="text-xs text-gray-500">Obrigado por ajudar a melhorar o BíbliaLM.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Encontrou um erro ou algo não funcionou como esperado? Descreva abaixo para que possamos corrigir.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição do Bug</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 text-sm resize-none h-32"
                placeholder="Ex: O botão de áudio não respondeu quando cliquei..."
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gravidade (Impacto)</label>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSeverity('low')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${severity === 'low' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Baixa
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('medium')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${severity === 'medium' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Média
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('high')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${severity === 'high' ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Alta
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Enviar Relatório
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BugReportModal;

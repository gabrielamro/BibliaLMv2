"use client";


import React, { useState } from 'react';
import { X, Mic2, Calendar, Clock, Target, ArrowRight, BookOpen } from 'lucide-react';

interface SermonSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { title: string, presentationDate: string, duration: number, occasion: string, mainVerse: string }) => void;
}

const SermonSetupModal: React.FC<SermonSetupModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [presentationDate, setPresentationDate] = useState('');
  const [duration, setDuration] = useState(40);
  const [occasion, setOccasion] = useState('Culto de Domingo');
  const [mainVerse, setMainVerse] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !presentationDate) return;
      onConfirm({ title, presentationDate, duration, occasion, mainVerse });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-bible-darkPaper w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X size={20} />
            </button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-bible-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-bible-gold border border-bible-gold/20">
                    <Mic2 size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Novo Sermão</h2>
                <p className="text-sm text-gray-500">Defina os detalhes da sua pregação.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título da Mensagem</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Ex: O Poder da Esperança" 
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-lg outline-none focus:ring-2 ring-bible-gold" 
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1"><Calendar size={12}/> Data</label>
                        <input 
                            type="datetime-local" 
                            value={presentationDate} 
                            onChange={(e) => setPresentationDate(e.target.value)} 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold" 
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1"><Clock size={12}/> Duração (min)</label>
                        <input 
                            type="number" 
                            value={duration} 
                            onChange={(e) => setDuration(parseInt(e.target.value))} 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1"><Target size={12}/> Ocasião</label>
                        <select 
                            value={occasion}
                            onChange={(e) => setOccasion(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold"
                        >
                            <option value="Culto de Domingo">Culto de Domingo</option>
                            <option value="Culto de Jovens">Culto de Jovens</option>
                            <option value="Estudo Bíblico">Estudo Bíblico</option>
                            <option value="Santa Ceia">Santa Ceia</option>
                            <option value="Casamento">Casamento</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1"><BookOpen size={12}/> Texto Base (Opcional)</label>
                        <input 
                            type="text" 
                            value={mainVerse} 
                            onChange={(e) => setMainVerse(e.target.value)} 
                            placeholder="Ex: João 3:16 ou Sl 23:1-4" 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold" 
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    Iniciar Preparo <ArrowRight size={18} />
                </button>
            </form>
        </div>
    </div>
  );
};

export default SermonSetupModal;

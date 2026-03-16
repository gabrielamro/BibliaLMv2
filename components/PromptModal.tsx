"use client";

import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, CornerDownRight } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  defaultValue = '',
  placeholder = 'Digite aqui...'
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-bible-gold/10 flex items-center justify-center mb-4 border border-bible-gold/20 text-bible-gold">
            <Edit3 size={28} />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          {label && <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">{label}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-bible-gold/30 text-sm font-medium resize-none h-32"
            />
          </div>

          <div className="flex flex-col gap-2">
            <button 
              type="submit"
              disabled={!value.trim()}
              className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Confirmar Alteração <Check size={18} />
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-[0.2em] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptModal;
import React from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { BlockType } from './types';
import { blockLabels } from './constants';

interface MobileAddBlockMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  onAIBuild: () => void;
}

export const MobileAddBlockMenu: React.FC<MobileAddBlockMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  onAIBuild
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end xl:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Sheet */}
      <div 
        className="relative w-full max-h-[80vh] bg-white dark:bg-gray-900 rounded-t-[40px] shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-bottom duration-500 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h3 className="font-black text-2xl text-bible-ink dark:text-white leading-tight">Adicionar Bloco</h3>
            <p className="text-sm text-gray-500">Escolha um elemento para sua página</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Action */}
        <button
          onClick={() => {
            onAIBuild();
            onClose();
          }}
          className="w-full p-4 mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white flex items-center gap-4 active:scale-95 transition-transform shadow-xl shadow-indigo-500/20"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold">Gerar com IA</p>
            <p className="text-xs text-indigo-100 opacity-80">A IA monta tudo para você</p>
          </div>
        </button>

        {/* Grids de Blocos */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {(Object.keys(blockLabels) as BlockType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              className="group flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-bible-gold transition-all active:scale-95"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md ${blockLabels[type].color}`}>
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">
                {blockLabels[type].label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

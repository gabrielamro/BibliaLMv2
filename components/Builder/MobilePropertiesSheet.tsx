import React from 'react';
import { X, Check } from 'lucide-react';
import { BlockProperties } from './BlockProperties';
import { Block } from './types';
import { blockLabels } from './constants';

interface MobilePropertiesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
  onUpdate: (data: any) => void;
  isEditing: boolean;
}

export const MobilePropertiesSheet: React.FC<MobilePropertiesSheetProps> = ({
  isOpen,
  onClose,
  block,
  onUpdate,
  isEditing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[260] flex flex-col justify-end lg:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Sheet */}
      <div 
        className="relative flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl animate-in slide-in-from-bottom duration-500 dark:bg-gray-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-800" />

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
             <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl ${blockLabels[block.type].color} shadow-lg`}>
                <Check size={22} />
             </div>
             <div className="min-w-0">
                <h3 className="truncate text-lg font-bold leading-tight text-bible-ink dark:text-white">Painel de Estilo</h3>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-500">{blockLabels[block.type].label}</p>
             </div>
          </div>
          
          <button 
            onClick={onClose}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:text-black dark:bg-gray-800 dark:hover:text-white"
            aria-label="Fechar painel de estilo"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <BlockProperties 
            block={block} 
            onUpdate={onUpdate} 
            onClose={onClose}
            isEditing={isEditing} 
          />
        </div>

        {/* Footer Action */}
        <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
           <button
             onClick={onClose}
             className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-bible-gold px-4 py-3 text-sm font-bold text-white shadow-xl shadow-bible-gold/20 transition-transform active:scale-95"
           >
             <Check size={20} />
             <span>Concluir e Salvar</span>
           </button>
        </div>
      </div>
    </div>
  );
};

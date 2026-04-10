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
    <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Sheet */}
      <div 
        className="relative w-full max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-[40px] shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-bottom duration-500 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${blockLabels[block.type].color} shadow-lg`}>
                <Check size={24} />
             </div>
             <div>
                <h3 className="font-bold text-xl text-bible-ink dark:text-white leading-tight">Painel de Estilo</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{blockLabels[block.type].label}</p>
             </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 pb-20">
          <BlockProperties 
            block={block} 
            onUpdate={onUpdate} 
            onClose={onClose}
            isEditing={isEditing} 
          />
        </div>

        {/* Footer Action */}
        <div className="absolute bottom-6 left-6 right-6 flex-shrink-0">
           <button
             onClick={onClose}
             className="w-full py-4 bg-bible-gold text-white font-bold rounded-2xl shadow-xl shadow-bible-gold/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
           >
             <Check size={20} />
             <span>Concluir e Salvar</span>
           </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  Settings2,
  X
} from 'lucide-react';
import { BlockType } from './types';
import { blockLabels } from './constants';

interface MobileToolbarProps {
  blockType: BlockType;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onOpenProperties: () => void;
  onClose: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  blockType,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onOpenProperties,
  onClose,
  canMoveUp,
  canMoveDown
}) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] lg:hidden animate-in fade-in slide-in-from-bottom duration-300">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-2 flex items-center justify-between">
        {/* Info do Bloco */}
        <div className="flex items-center gap-2 pl-3 mr-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${blockLabels[blockType].color} shadow-sm`}>
            <Settings2 size={16} />
          </div>
          <div className="hidden xs:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Editando</p>
            <p className="text-xs font-bold text-bible-ink dark:text-white leading-none whitespace-nowrap">
              {blockLabels[blockType].label}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl disabled:opacity-20 transition-colors"
            title="Mover para cima"
          >
            <ChevronUp size={20} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl disabled:opacity-20 transition-colors"
            title="Mover para baixo"
          >
            <ChevronDown size={20} />
          </button>
          
          <div className="w-[1px] h-6 bg-gray-100 dark:bg-gray-800 mx-1" />
          
          <button
            onClick={onDuplicate}
            className="p-3 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-2xl transition-colors"
            title="Duplicar"
          >
            <Copy size={20} />
          </button>
          
          <button
            onClick={onOpenProperties}
            className="p-3 text-bible-gold hover:bg-bible-gold/10 rounded-2xl transition-colors"
            title="Ver Propriedades"
          >
            <Settings2 size={20} />
          </button>

          <button
            onClick={onRemove}
            className="p-3 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
            title="Excluir"
          >
            <Trash2 size={20} />
          </button>

          <div className="w-[1px] h-6 bg-gray-100 dark:bg-gray-800 mx-1" />

          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"
            title="Cofirmar/Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

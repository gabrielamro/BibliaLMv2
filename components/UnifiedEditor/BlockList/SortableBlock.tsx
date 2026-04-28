import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Settings2 } from 'lucide-react';

interface SortableBlockProps {
  id: string;
  children: React.ReactNode;
  layoutWidth?: string;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onSettings?: () => void;
  onLayoutWidthChange?: (width: string) => void;
  isEditing?: boolean;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({ 
  id, 
  children, 
  layoutWidth = '1/1',
  onRemove,
  onDuplicate,
  onSettings,
  onLayoutWidthChange,
  isEditing = true
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const widthClass = {
    '1/1': 'w-full',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '2/3': 'w-2/3',
  }[layoutWidth] || 'w-full';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group px-1 mb-10 transition-all duration-300 box-border ${widthClass}`}
    >
      <div className={`relative rounded-2xl transition-all duration-300 ${isEditing ? 'hover:ring-2 hover:ring-bible-gold/30' : ''}`}>
        
        {/* Drag Handle & Label */}
        {isEditing && (
          <div 
            {...attributes} 
            {...listeners}
            className="absolute left-2 -top-10 flex items-center gap-1.5 rounded-full border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 py-1 shadow-sm cursor-grab active:cursor-grabbing text-gray-400 hover:text-bible-gold transition-all z-40 opacity-0 group-hover:opacity-40 hover:!opacity-100 pointer-events-none"
          >
            <div className="flex items-center justify-center p-1 pointer-events-auto">
              <GripVertical size={16} />
            </div>
          </div>
        )}

        {/* Action Buttons (Floating) */}
        {isEditing && (
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
             <button 
               onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
               className="p-1.5 bg-white shadow-lg border border-gray-100 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
               title="Duplicar"
             >
               <Copy size={14} />
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
               className="p-1.5 bg-white shadow-lg border border-gray-100 rounded-full text-red-500 hover:bg-red-50 transition-colors"
               title="Remover"
             >
               <Trash2 size={14} />
             </button>
          </div>
        )}

        {/* Top Center: Size Options */}
        {isEditing && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-full shadow-lg flex items-center gap-1 p-1 z-50 border border-gray-100">
             {[
               { label: '1/3', value: '1/3' },
               { label: '1/2', value: '1/2' },
               { label: '1/1', value: '1/1' },
             ].map(opt => (
               <button
                 key={opt.value}
                 onClick={(e) => { e.stopPropagation(); onLayoutWidthChange?.(opt.value); }}
                 className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${layoutWidth === opt.value ? 'bg-bible-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}
               >
                 {opt.label}
               </button>
             ))}
          </div>
        )}

        {/* Content Container */}
        <div className={`w-full ${isDragging ? 'pointer-events-none' : ''}`}>
          {children}
        </div>

        {/* Quick Settings Bar (Bottom) */}
        {isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); onSettings?.(); }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-bible-gold text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl flex items-center gap-2 hover:bg-bible-gold/90 z-[60] border-2 border-white"
          >
            <Settings2 size={12} />
            CONFIGURAR
          </button>
        )}
      </div>
    </div>
  );
};

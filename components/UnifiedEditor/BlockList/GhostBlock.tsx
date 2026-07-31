import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { BlockType } from '../../Builder/types';
import { BlockPickerMenu } from '../components/BlockPickerMenu';

interface GhostBlockProps {
  id: string;
  width: string;
  onAdd: (type: BlockType, width?: '1/3' | '1/2' | '2/3' | '1/1') => void;
}

export const GhostBlock: React.FC<GhostBlockProps> = ({ id, width, onAdd }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isOver, isDragging } = useSortable({ id });
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    gridColumn: `span ${width === '2/3' ? 8 : width === '1/2' ? 6 : width === '1/3' ? 4 : 12}`,
  };

  const widthClass = 'w-full';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative inline-block h-[140px] min-w-0 align-top box-border ${widthClass}`}
      {...attributes}
      {...listeners}
    >
      <div
        className={`group relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 ${
          isOver
            ? 'scale-[0.98] border-bible-gold bg-bible-gold/10 shadow-inner shadow-bible-gold/10'
            : 'border-gray-100 bg-gray-50/30 shadow-sm hover:border-bible-gold/30 hover:bg-white'
        }`}
        onClick={() => setIsPickerOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-bible-gold/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div
          data-testid={`ghost-block-insertion-line-${id}`}
          className={`pointer-events-none absolute left-4 right-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-bible-gold shadow-[0_0_18px_rgba(212,160,23,0.35)] transition-all ${
            isOver ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0'
          }`}
        />

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-white text-gray-300 shadow-lg transition-all duration-300 ${
            isOver ? 'scale-125 border-bible-gold text-bible-gold' : 'border-gray-200 group-hover:scale-110 group-hover:rotate-90 group-hover:border-bible-gold group-hover:text-bible-gold'
          }`}
        >
          <Plus size={24} strokeWidth={2.5} />
        </div>

        <div className="mt-2 flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 transition-all group-hover:text-bible-gold/60">
            Slot Vazio
          </span>
          <span className="text-[10px] font-bold text-gray-400 transition-all group-hover:text-bible-gold">{width} Grid</span>
        </div>

        {isPickerOpen && (
          <div
            data-testid={`ghost-block-picker-${id}`}
            className="absolute inset-0 z-10 rounded-3xl border border-bible-gold/30 bg-white/98 p-3 shadow-2xl backdrop-blur"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <BlockPickerMenu
              compact
              testId={`ghost-block-picker-menu-${id}`}
              onSelect={(type, selectedWidth) => {
                onAdd(type, selectedWidth);
                setIsPickerOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

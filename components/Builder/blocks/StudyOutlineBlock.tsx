import React from 'react';
import { EditorTopBar } from '../../UnifiedEditor/components/EditorTopBar';

interface StudyOutlineBlockProps {
  data: any;
  isEditing: boolean;
  onUpdate?: (data: any) => void;
  editor?: any;
}

export const StudyOutlineBlock: React.FC<StudyOutlineBlockProps> = ({ data, isEditing, onUpdate, editor }) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const activeIndex = typeof data.activeIndex === 'number' ? data.activeIndex : 0;

  return (
    <section className="rounded-[32px] border border-gray-100 dark:border-white/5 bg-white dark:bg-bible-darkPaper p-6 md:p-8 shadow-lg w-full h-full">
      {isEditing && editor && (
        <div className="mb-4 bg-white/50 rounded-2xl overflow-hidden border border-bible-gold/10">
          <EditorTopBar editor={editor} />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">{data.title || 'Template'}</p>
      <p className="mt-1 text-sm text-[#7b6c5e]">{data.description}</p>
      <div className="mt-5 space-y-2">
        {items.map((item: string, index: number) => (
          <div
            key={`${item}-${index}`}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
              index === activeIndex
                ? 'border-[#c7a56f] bg-[#b3874c] text-white shadow-lg'
                : 'border-[#eee2d2] bg-[#fcfaf7] text-[#5d5248]'
            }`}
          >
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${index === activeIndex ? 'bg-white/20' : 'bg-[#f4e8d4] text-[#b3874c]'}`}>
              {index + 1}
            </span>
            <span className="font-medium">{item}</span>
          </div>
        ))}
        {isEditing && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#d7c7aa] px-4 py-3 text-sm text-[#8c6b3e]">Adicione itens do roteiro no painel lateral.</p>
        )}
      </div>
      </div>
    </section>
  );
};

import React from 'react';
import {
  BookOpen,
  Columns3,
  LayoutTemplate,
  Maximize2,
  MessageCircle,
  Play,
  Sparkles,
  Type,
  User,
  Video,
} from 'lucide-react';
import { blockLabels } from '../../Builder/constants';
import type { BlockType } from '../../Builder/types';

interface BlockPickerMenuProps {
  onSelect: (type: BlockType, width?: '1/3' | '1/2' | '1/1') => void;
  title?: string;
  description?: string;
  testId?: string;
  compact?: boolean;
}

const spacerSizes: Array<'1/3' | '1/2' | '1/1'> = ['1/3', '1/2', '1/1'];

const iconByType: Record<BlockType, React.ComponentType<{ size?: number; className?: string }>> = {
  hero: LayoutTemplate,
  authority: User,
  biblical: BookOpen,
  video: Video,
  footer: Columns3,
  'study-content': Type,
  slide: Play,
  'hero-split': LayoutTemplate,
  'study-outline': Columns3,
  'related-verses': Sparkles,
  'reflection-question': MessageCircle,
  'rich-text': Type,
  spacer: Maximize2,
};

export const BlockPickerMenu: React.FC<BlockPickerMenuProps> = ({
  onSelect,
  title = 'Escolha um bloco',
  description = 'Selecione o elemento para preencher este espaço.',
  testId,
  compact = false,
}) => {
  const [isChoosingSpacerSize, setIsChoosingSpacerSize] = React.useState(false);
  const blockOptions = React.useMemo(() => Object.keys(blockLabels) as BlockType[], []);

  return (
    <div data-testid={testId} className="flex h-full flex-col gap-2">
      {isChoosingSpacerSize ? (
        <>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-bible-gold">Escolha o tamanho do espaçador</p>
            <p className="mt-1 text-[11px] text-gray-500">Defina a largura antes de inserir o bloco.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {spacerSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelect('spacer', size)}
                className="rounded-xl border border-bible-gold/20 bg-bible-gold/5 px-2 py-2 text-xs font-black text-bible-gold transition hover:bg-bible-gold hover:text-white"
              >
                {size}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {!compact && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-bible-gold">{title}</p>
              <p className="mt-1 text-[11px] text-gray-500">{description}</p>
            </div>
          )}
          <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {blockOptions.map((type) => {
              const Icon = iconByType[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (type === 'spacer') {
                      setIsChoosingSpacerSize(true);
                      return;
                    }
                    onSelect(type);
                  }}
                  className={`rounded-xl border border-gray-100 bg-gray-50 text-left transition hover:border-bible-gold/30 hover:bg-bible-gold/5 ${
                    compact ? 'px-2 py-3' : 'px-2 py-2'
                  }`}
                >
                  <span className={`flex items-center ${compact ? 'justify-start gap-3' : 'gap-2'} text-[11px] font-bold text-bible-ink`}>
                    <span className={`inline-flex items-center justify-center rounded-lg ${blockLabels[type].color} ${compact ? 'h-8 w-8' : 'h-7 w-7'}`}>
                      <Icon size={compact ? 16 : 14} />
                    </span>
                    {blockLabels[type].label}
                  </span>
                  {!compact && <span className="mt-1 block text-[10px] text-gray-500">{blockLabels[type].description}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

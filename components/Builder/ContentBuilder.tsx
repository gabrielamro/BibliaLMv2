import React from 'react';
import { 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2,
  X
} from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import { Block, BlockType } from './types';
import { blockLabels } from './constants';

interface ContentBuilderProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, data: any) => void;
  onMoveBlock: (index: number, newIndex: number) => void;
  onDuplicateBlock: (id: string, index: number) => void;
  onRemoveBlock: (id: string) => void;
  onAddBlock: (type: BlockType, index?: number) => void;
  isEditing: boolean;
  canvasWidth: 'mobile' | 'tablet' | 'desktop' | 'full';
  authorName?: string;
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onAddBlock,
  isEditing,
  canvasWidth,
  authorName
}) => {
  const [activeSlotMenu, setActiveSlotMenu] = React.useState<number | 'footer' | null>(null);

  const isUniqueBlockAlreadyAdded = (type: BlockType) => {
    return ['hero', 'footer'].includes(type) && blocks.some(b => b.type === type);
  };
  const availableBlocks = (Object.keys(blockLabels) as BlockType[]).filter(t => !isUniqueBlockAlreadyAdded(t));

  if (blocks.length === 0 && isEditing) {
    return (
      <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
          Adicione blocos para começar
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Use a paleta à esquerda ou clique nos botões rápidos abaixo
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {availableBlocks.map(type => (
            <button
              key={type}
              onClick={() => onAddBlock(type)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white active:scale-95 shadow-sm"
            >
              + {blockLabels[type].label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          {/* Espaçador para adicionar bloco entre itens */}
          {isEditing && (
            <div className="relative h-6 group/spacer flex items-center justify-center -my-3 z-40">
              <div className="absolute inset-x-0 h-[1px] bg-bible-gold/20 scale-x-0 group-hover/spacer:scale-x-100 transition-transform duration-300" />

              {activeSlotMenu === index ? (
                <div className="absolute top-1/2 -translate-y-1/2 flex flex-wrap justify-center items-center gap-1.5 p-1.5 bg-white dark:bg-gray-900 border border-bible-gold/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 min-w-[320px] max-w-full">
                  <div className="w-full flex justify-between px-2 py-1 mb-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Inserir Bloco</span>
                    <button onClick={() => setActiveSlotMenu(null)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                  {availableBlocks.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        onAddBlock(type, index);
                        setActiveSlotMenu(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bible-gold hover:text-white active:scale-95 border border-gray-100 dark:border-gray-700 whitespace-nowrap"
                    >
                      {blockLabels[type].label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setActiveSlotMenu(index)}
                  className="opacity-0 group-hover/spacer:opacity-100 transition-all duration-300 bg-bible-gold text-white rounded-full p-1.5 shadow-lg hover:scale-110 active:scale-90"
                  title="Inserir bloco aqui"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          )}

          <div
            className={`relative group transition-all duration-300 ${
              isEditing && selectedBlockId === block.id 
                ? 'ring-2 ring-bible-gold z-20 shadow-2xl' 
                : isEditing ? 'hover:ring-1 hover:ring-bible-gold/30' : ''
            }`}
            onClick={() => isEditing && onSelectBlock(block.id)}
          >
            {/* Controles de Bloco (Apenas em edição - Desktop) */}
            {isEditing && (
              <div className={`absolute right-4 top-4 items-center gap-1 z-30 transition-all duration-300 hidden xl:flex ${
                selectedBlockId === block.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
              }`}>
                <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveBlock(index, Math.max(0, index - 1)); }}
                    disabled={index === 0 || ['hero', 'footer'].includes(block.type)}
                    className="p-2 text-gray-500 hover:text-bible-gold hover:bg-bible-gold/10 rounded-xl disabled:opacity-20 transition-colors"
                    title="Mover para cima"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveBlock(index, Math.min(blocks.length - 1, index + 1)); }}
                    disabled={index === blocks.length - 1 || ['hero', 'footer'].includes(block.type)}
                    className="p-2 text-gray-500 hover:text-bible-gold hover:bg-bible-gold/10 rounded-xl disabled:opacity-20 transition-colors"
                    title="Mover para baixo"
                  >
                    <ChevronDown size={18} />
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicateBlock(block.id, index); }}
                    disabled={['hero', 'footer'].includes(block.type)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl disabled:opacity-20 transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                    disabled={['hero', 'footer'].includes(block.type)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl disabled:opacity-20 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                  {selectedBlockId === block.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectBlock(null); }}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors ml-1"
                      title="Fechar edição"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Renderizador do Bloco */}
            <BlockRenderer 
              block={block} 
              isEditing={isEditing && selectedBlockId === block.id} 
              onUpdate={(data) => onUpdateBlock(block.id, data)}
              authorName={authorName}
              canvasWidth={canvasWidth}
            />
          </div>
        </React.Fragment>
      ))}

      {/* Botão para adicionar bloco no final */}
      {isEditing && (
        <div className="flex justify-center p-8 mt-4 relative">
          {activeSlotMenu === 'footer' ? (
            <div className="flex flex-wrap justify-center items-center gap-1.5 p-3 bg-white dark:bg-gray-900 border border-bible-gold/30 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300 max-w-lg">
              <div className="w-full flex justify-between px-2 mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Novo Bloco no Final</span>
                <button onClick={() => setActiveSlotMenu(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              </div>
              {availableBlocks.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    onAddBlock(type);
                    setActiveSlotMenu(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bible-gold hover:text-white active:scale-95 border border-gray-100 dark:border-gray-700"
                >
                  {blockLabels[type].label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setActiveSlotMenu('footer')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 hover:border-bible-gold hover:text-bible-gold transition-all group active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold text-sm">Adicionar Seção</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

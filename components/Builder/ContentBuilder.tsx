import React from 'react';
import { 
  Plus, 
  Minus,
  Maximize2,
  ChevronsUpDown,
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2,
  X,
  GripVertical
} from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
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

const SectionResizer = ({ 
  value, 
  onChange, 
  position,
  isActive
}: { 
  value: number; 
  onChange: (val: number) => void; 
  position: 'top' | 'bottom';
  isActive?: boolean;
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startYRef = React.useRef(0);
  const startValueRef = React.useRef(0);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = (clientY - startYRef.current) * (position === 'top' ? 1 : -1);
      const newValue = Math.floor((startValueRef.current + deltaY) / 4) * 4;
      // Padding interno nunca deve ser negativo para não quebrar o layout
      onChange(Math.max(0, newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, position, onChange]);

  const handleStart = (clientY: number, valueAtStart: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = valueAtStart;
  };

  return (
    <div 
      className={`absolute left-0 right-0 h-6 z-50 cursor-ns-resize group/resizer flex items-center justify-center transition-all ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      onMouseDown={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleStart(e.clientY, value);
      }}
      onTouchStart={(e: React.TouchEvent) => {
        e.stopPropagation();
        handleStart(e.touches[0].clientY, value);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`w-full h-[3px] bg-bible-gold transition-all duration-700 rounded-full ${isDragging ? 'opacity-100 h-[6px] scale-x-105 shadow-[0_0_20px_rgba(234,179,8,0.8)]' : isActive ? 'opacity-100 shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse' : 'opacity-0 group-hover/resizer:opacity-60 h-[3px]'}`} />
      
      <div className={`absolute left-1/2 -translate-x-1/2 px-3 py-1.5 bg-bible-gold text-white text-[10px] font-black uppercase rounded-2xl shadow-2xl pointer-events-none transition-all flex items-center gap-2 ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/resizer:opacity-100'} ${position === 'top' ? 'top-10' : 'bottom-10'}`}>
        <ChevronsUpDown size={14} className={isDragging ? 'animate-bounce' : ''} />
        {position === 'top' ? 'Padding Superior' : 'Padding Inferior'}: <span className="font-mono text-sm ml-1">{value}px</span>
      </div>
      
      <div className={`absolute w-14 h-8 bg-white dark:bg-gray-900 border-2 border-bible-gold rounded-xl flex items-center justify-center shadow-2xl transition-all duration-200 ${isDragging ? 'scale-125' : 'opacity-0 group-hover/resizer:opacity-100 translate-y-0'}`}>
        <ChevronsUpDown size={16} className="text-bible-gold" />
      </div>
    </div>
  );
};

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
  const [showResizers, setShowResizers] = React.useState(false); // Default to false as requested to not hinder usability

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
    <>
    <Droppable droppableId="canvas-blocks">
      {(provided) => (
        <div 
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="relative min-h-[200px]"
        >
          {blocks.map((block, index) => (
            <Draggable key={block.id} draggableId={block.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={`relative group transition-all duration-300 ${
                    snapshot.isDragging ? 'z-50' : ''
                  } ${
                    isEditing && selectedBlockId === block.id 
                      ? 'ring-2 ring-bible-gold z-20 shadow-2xl' 
                      : isEditing ? 'hover:ring-1 hover:ring-bible-gold/30' : ''
                  }`}
                  onClick={() => isEditing && onSelectBlock(block.id)}
                >
                  {/* Drag Handle & Info (Mobile/Desktop) */}
                  {isEditing && (
                    <div className="absolute -top-3 left-6 z-30 flex items-center gap-1 group/label">
                      {/* Control Handle */}
                      <div 
                        {...provided.dragHandleProps}
                        className={`cursor-grab active:cursor-grabbing px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md border border-white/20 transition-all flex items-center gap-1.5 ${blockLabels[block.type].color} ${snapshot.isDragging ? 'ring-2 ring-white scale-110 shadow-bible-gold/50' : 'hover:scale-105'}`}
                      >
                        <GripVertical size={12} className={snapshot.isDragging ? 'animate-pulse' : ''} />
                        {blockLabels[block.type].label}
                      </div>

                      {/* Desktop only side handle (optional, but keeping it for ease of use) */}
                      <div 
                        {...provided.dragHandleProps}
                        className="p-2 text-gray-400 hover:text-bible-gold transition-opacity hidden lg:flex cursor-grab active:cursor-grabbing"
                        title="Arrastar Seção"
                      >
                        <GripVertical size={20} />
                      </div>
                    </div>
                  )}

                  {/* Dimensionador de Seção (Top) */}
                  {isEditing && selectedBlockId === block.id && showResizers && (
                    <SectionResizer 
                      position="top"
                      isActive={showResizers}
                      value={typeof block.data.padding === 'number' ? block.data.padding : (block.data.padding?.top ?? 0)}
                      onChange={(val: number) => onUpdateBlock(block.id, { 
                        padding: { 
                          ...(typeof block.data.padding === 'object' ? block.data.padding : { top: typeof block.data.padding === 'number' ? block.data.padding : 0, bottom: typeof block.data.padding === 'number' ? block.data.padding : 0 }), 
                          top: val 
                        } 
                      })}
                    />
                  )}

                  {/* Dimensionador de Seção (Bottom) */}
                  {isEditing && selectedBlockId === block.id && showResizers && (
                    <SectionResizer 
                      position="bottom"
                      isActive={showResizers}
                      value={typeof block.data.padding === 'number' ? block.data.padding : (block.data.padding?.bottom ?? 0)}
                      onChange={(val: number) => onUpdateBlock(block.id, { 
                        padding: { 
                          ...(typeof block.data.padding === 'object' ? block.data.padding : { top: typeof block.data.padding === 'number' ? block.data.padding : 0, bottom: typeof block.data.padding === 'number' ? block.data.padding : 0 }), 
                          bottom: val 
                        } 
                      })}
                    />
                  )}

                  {/* Controles de Bloco (Apenas em edição - Desktop) */}
                  {isEditing && (
                    <div className={`absolute right-4 top-4 items-center gap-1 z-30 transition-all duration-300 hidden lg:flex ${
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
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowResizers(!showResizers); }}
                          className={`p-2 rounded-xl transition-all ${showResizers ? 'text-bible-gold bg-bible-gold/10' : 'text-gray-500 hover:text-bible-gold hover:bg-bible-gold/5'}`}
                          title={showResizers ? "Ocultar ajustes de altura" : "Mostrar ajustes de altura"}
                        >
                          <ChevronsUpDown size={18} />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
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
                    onUpdate={onUpdateBlock}
                    authorName={authorName}
                    canvasWidth={canvasWidth}
                  />

                  {/* Insertion Line (Only when dragging over) */}
                  {snapshot.isDragging && (
                    <div className="absolute inset-0 bg-bible-gold/5 border-2 border-bible-gold border-dashed rounded-lg pointer-events-none" />
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}

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
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-bible-gold hover:text-white active:scale-95 border border-gray-100 dark:border-gray-700"
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
        )}
      </Droppable>
    </>
  );
};

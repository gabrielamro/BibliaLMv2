import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronsLeftRight,
  Plus,
  Pencil,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  X,
  GripVertical,
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
  layoutGridUnits?: number;
  getBlockLayoutUnits?: (block: Block) => number;
  getBlockLayoutWidth?: (block: Block) => string | null;
  getBlockLayoutAlign?: (block: Block) => string | null;
  getBlockGridColumn?: (block: Block) => string | undefined;
  onEditBlock?: (id: string) => void;
  onCycleBlockWidth?: (id: string) => void;
}

interface SectionResizerProps {
  value: number;
  onChange: (val: number) => void;
  position: 'top' | 'bottom';
  isActive?: boolean;
}

interface SortableCanvasBlockProps {
  block: Block;
  index: number;
  totalBlocks: number;
  selectedBlockId: string | null;
  isEditing: boolean;
  authorName?: string;
  canvasWidth: 'mobile' | 'tablet' | 'desktop' | 'full';
  showResizers: boolean;
  layoutGridUnits?: number;
  layoutUnits?: number;
  layoutWidth?: string | null;
  layoutAlign?: string | null;
  gridColumn?: string;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, data: any) => void;
  onMoveBlock: (index: number, newIndex: number) => void;
  onDuplicateBlock: (id: string, index: number) => void;
  onRemoveBlock: (id: string) => void;
  onEditBlock?: (id: string) => void;
  onCycleBlockWidth?: (id: string) => void;
  onToggleResizers: () => void;
}

const normalizePaddingValue = (padding: Block['data']['padding'], position: 'top' | 'bottom') => {
  if (typeof padding === 'number') return padding;
  if (padding && typeof padding === 'object' && typeof padding[position] === 'number') return padding[position];
  return 0;
};

const buildPaddingPatch = (padding: Block['data']['padding'], position: 'top' | 'bottom', nextValue: number) => {
  const currentTop = normalizePaddingValue(padding, 'top');
  const currentBottom = normalizePaddingValue(padding, 'bottom');

  return {
    padding: {
      top: position === 'top' ? nextValue : currentTop,
      bottom: position === 'bottom' ? nextValue : currentBottom,
    },
  };
};

const SectionResizer: React.FC<SectionResizerProps> = ({ value, onChange, position, isActive }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startYRef = React.useRef(0);
  const startValueRef = React.useRef(0);

  React.useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in event ? event.touches[0]?.clientY ?? startYRef.current : event.clientY;
      const deltaY = (clientY - startYRef.current) * (position === 'top' ? 1 : -1);
      const snapped = Math.floor((startValueRef.current + deltaY) / 4) * 4;
      onChange(Math.max(0, snapped));
    };

    const handlePointerUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, onChange, position]);

  const startDrag = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = value;
  };

  return (
    <div
      data-testid={`section-resizer-${position}`}
      className={`absolute left-0 right-0 z-50 flex h-6 cursor-ns-resize items-center justify-center transition-all ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startDrag(event.clientY);
      }}
      onTouchStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startDrag(event.touches[0].clientY);
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`w-full rounded-full bg-bible-gold transition-all duration-200 ${
          isDragging ? 'h-[6px] scale-x-[1.02] opacity-100 shadow-[0_0_20px_rgba(234,179,8,0.7)]' : isActive ? 'h-[4px] opacity-100' : 'h-[3px] opacity-0 group-hover/resizer:opacity-60'
        }`}
      />
      <div
        className={`pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-bible-gold px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-2xl transition-all ${
          isDragging ? 'scale-110 opacity-100' : 'opacity-0 group-hover/resizer:opacity-100'
        } ${position === 'top' ? 'top-10' : 'bottom-10'}`}
      >
        <ChevronsUpDown size={14} />
        {position === 'top' ? 'Padding Superior' : 'Padding Inferior'}:
        <span className="ml-1 font-mono text-sm">{value}px</span>
      </div>
    </div>
  );
};

const SortableCanvasBlock: React.FC<SortableCanvasBlockProps> = ({
  block,
  index,
  totalBlocks,
  selectedBlockId,
  isEditing,
  authorName,
  canvasWidth,
  showResizers,
  layoutGridUnits,
  layoutUnits,
  layoutWidth,
  layoutAlign,
  gridColumn,
  onSelectBlock,
  onUpdateBlock,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onEditBlock,
  onCycleBlockWidth,
  onToggleResizers,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const isSelected = selectedBlockId === block.id;
  const paddingTop = normalizePaddingValue(block.data?.padding, 'top');
  const paddingBottom = normalizePaddingValue(block.data?.padding, 'bottom');

  const layoutClasses = React.useMemo(() => {
    if (layoutGridUnits) return '';
    const width = layoutWidth || block.data.layoutWidth;
    if (!width || width === '1/1') return 'w-full block';
    
    const widthMap: Record<string, string> = {
      '1/2': 'md:w-1/2',
      '1/3': 'md:w-1/3',
      '2/3': 'md:w-2/3'
    };
    
    return `w-full ${widthMap[width] || 'w-full'} inline-block align-top`;
  }, [layoutGridUnits, layoutWidth, block.data.layoutWidth]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    gridColumn: gridColumn ?? (layoutUnits ? `span ${layoutUnits} / span ${layoutUnits}` : undefined),
    marginTop: index === 0 ? 0 : paddingTop,
    marginBottom: paddingBottom,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`builder-block-${block.type}-${index}`}
      data-width={layoutWidth ?? undefined}
      data-units={layoutUnits ?? undefined}
      data-align={layoutAlign ?? undefined}
      data-padding-top={paddingTop}
      data-padding-bottom={paddingBottom}
      className={`group/resizer relative transition-all duration-200 ${layoutClasses} ${
        isDragging ? 'opacity-60 shadow-2xl' : ''
      } ${isEditing && isSelected ? 'z-20 ring-2 ring-bible-gold shadow-2xl' : isEditing ? 'hover:ring-1 hover:ring-bible-gold/30' : ''}`}
      onClick={() => isEditing && onSelectBlock(block.id)}
    >
      {isEditing && (
        <div className="absolute -top-10 left-4 z-30 flex items-center gap-1 group/label transition-opacity opacity-0 group-hover/resizer:opacity-40 hover:!opacity-100 pointer-events-none">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`flex cursor-grab items-center justify-center rounded-full border border-white/20 p-2 shadow-md transition-all active:cursor-grabbing pointer-events-auto ${blockLabels[block.type].color} ${
              isDragging ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
            }`}
            aria-label="Mover bloco"
          >
            <GripVertical size={16} />
          </button>
        </div>
      )}

      {isEditing && isSelected && showResizers && (
        <SectionResizer
          position="top"
          isActive={showResizers}
          value={paddingTop}
          onChange={(nextValue) => onUpdateBlock(block.id, buildPaddingPatch(block.data?.padding, 'top', nextValue))}
        />
      )}

      {isEditing && isSelected && showResizers && (
        <SectionResizer
          position="bottom"
          isActive={showResizers}
          value={paddingBottom}
          onChange={(nextValue) => onUpdateBlock(block.id, buildPaddingPatch(block.data?.padding, 'bottom', nextValue))}
        />
      )}

      {isEditing && (
        <div
          className={`absolute right-4 top-4 z-30 hidden items-center gap-1 transition-all duration-300 lg:flex ${
            isSelected ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0 group-hover/resizer:pointer-events-auto group-hover/resizer:translate-y-0 group-hover/resizer:opacity-100'
          }`}
        >
          <div className="flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1 rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMoveBlock(index, Math.max(0, index - 1));
              }}
              disabled={index === 0 || ['hero', 'footer'].includes(block.type)}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold disabled:opacity-20"
              title="Mover para cima"
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMoveBlock(index, Math.min(totalBlocks - 1, index + 1));
              }}
              disabled={index === totalBlocks - 1 || ['hero', 'footer'].includes(block.type)}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold disabled:opacity-20"
              title="Mover para baixo"
            >
              <ChevronDown size={18} />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCycleBlockWidth?.(block.id);
              }}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-[#8c6b3e]/10 hover:text-[#8c6b3e]"
              title="Ajustar largura do bloco"
              aria-label="Ajustar largura do bloco"
            >
              <ChevronsLeftRight size={18} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEditBlock?.(block.id);
              }}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-[#1f2b3f]/10 hover:text-[#1f2b3f]"
              title="Editar propriedades"
              aria-label="Editar propriedades do bloco"
            >
              <Pencil size={18} />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDuplicateBlock(block.id, index);
              }}
              disabled={['hero', 'footer'].includes(block.type)}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-20"
              title="Duplicar"
            >
              <Copy size={18} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveBlock(block.id);
              }}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleResizers();
              }}
              className={`rounded-xl p-2 transition-all ${showResizers ? 'bg-bible-gold/10 text-bible-gold' : 'text-gray-500 hover:bg-bible-gold/5 hover:text-bible-gold'}`}
              title={showResizers ? 'Ocultar ajustes de altura' : 'Mostrar ajustes de altura'}
              aria-label={showResizers ? 'Ocultar ajustes de altura' : 'Mostrar ajustes de altura'}
            >
              <ChevronsUpDown size={18} />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            {isSelected && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectBlock(null);
                }}
                className="ml-1 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="Fechar edição"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      <BlockRenderer
        block={block}
        isEditing={isEditing && isSelected}
        onUpdate={onUpdateBlock}
        authorName={authorName}
        canvasWidth={canvasWidth}
        layoutWidth={layoutWidth || block.layoutWidth || block.data?.layoutWidth}
      />
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
  authorName,
  layoutGridUnits,
  getBlockLayoutUnits,
  getBlockLayoutWidth,
  getBlockLayoutAlign,
  getBlockGridColumn,
  onEditBlock,
  onCycleBlockWidth,
}) => {
  const [activeSlotMenu, setActiveSlotMenu] = React.useState<number | 'footer' | null>(null);
  const [showResizers, setShowResizers] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBlock = React.useMemo(
    () => (activeId ? blocks.find((block) => block.id === activeId) ?? null : null),
    [activeId, blocks],
  );

  const isUniqueBlockAlreadyAdded = (type: BlockType) => ['hero', 'footer'].includes(type) && blocks.some((block) => block.type === type);
  const availableBlocks = (Object.keys(blockLabels) as BlockType[]).filter((type) => !isUniqueBlockAlreadyAdded(type));

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const currentIndex = blocks.findIndex((block) => block.id === active.id);
      const nextIndex = blocks.findIndex((block) => block.id === over.id);
      if (currentIndex < 0 || nextIndex < 0 || currentIndex === nextIndex) return;

      onMoveBlock(currentIndex, nextIndex);
    },
    [blocks, onMoveBlock],
  );

  if (blocks.length === 0 && isEditing) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Plus size={32} className="text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-600">Adicione blocos para começar</h3>
        <p className="mb-6 text-sm text-gray-400">Use a biblioteca à esquerda ou clique nos botões rápidos abaixo.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {availableBlocks.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddBlock(type)}
              className="rounded-xl bg-bible-gold/10 px-4 py-2 text-sm font-medium text-bible-gold shadow-sm transition-all hover:bg-bible-gold hover:text-white active:scale-95"
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={blocks.map((block) => block.id)} strategy={rectSortingStrategy}>
          <div
            className={`relative min-h-[200px] ${layoutGridUnits ? 'grid gap-6' : 'flex flex-wrap items-start'}`}
            style={layoutGridUnits ? { gridTemplateColumns: `repeat(${layoutGridUnits}, minmax(0, 1fr))` } : undefined}
          >
            {blocks.map((block, index) => {
              const layoutUnits = layoutGridUnits ? Math.min(Math.max(getBlockLayoutUnits?.(block) ?? layoutGridUnits, 1), layoutGridUnits) : undefined;
              const layoutWidth = getBlockLayoutWidth?.(block) ?? null;
              const layoutAlign = getBlockLayoutAlign?.(block) ?? null;
              const gridColumn = getBlockGridColumn?.(block);

              return (
                <SortableCanvasBlock
                  key={block.id}
                  block={block}
                  index={index}
                  totalBlocks={blocks.length}
                  selectedBlockId={selectedBlockId}
                  isEditing={isEditing}
                  authorName={authorName}
                  canvasWidth={canvasWidth}
                  showResizers={showResizers}
                  layoutGridUnits={layoutGridUnits}
                  layoutUnits={layoutUnits}
                  layoutWidth={layoutWidth}
                  layoutAlign={layoutAlign}
                  gridColumn={gridColumn}
                  onSelectBlock={onSelectBlock}
                  onUpdateBlock={onUpdateBlock}
                  onMoveBlock={onMoveBlock}
                  onDuplicateBlock={onDuplicateBlock}
                  onRemoveBlock={onRemoveBlock}
                  onEditBlock={onEditBlock}
                  onCycleBlockWidth={onCycleBlockWidth}
                  onToggleResizers={() => setShowResizers((current) => !current)}
                />
              );
            })}

            {isEditing && (
              <div className="relative mt-4 flex justify-center p-8" style={layoutGridUnits ? { gridColumn: `span ${layoutGridUnits} / span ${layoutGridUnits}` } : undefined}>
                {activeSlotMenu === 'footer' ? (
                  <div className="animate-in slide-in-from-bottom-2 flex max-w-lg flex-wrap items-center justify-center gap-1.5 rounded-3xl border border-bible-gold/30 bg-white p-3 shadow-2xl duration-300">
                    <div className="mb-2 flex w-full justify-between px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Novo bloco no final</span>
                      <button type="button" onClick={() => setActiveSlotMenu(null)} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                    {availableBlocks.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onAddBlock(type);
                          setActiveSlotMenu(null);
                        }}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-bible-gold hover:text-white active:scale-95"
                      >
                        {blockLabels[type].label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSlotMenu('footer')}
                    className="group flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-3 text-gray-400 transition-all hover:border-bible-gold hover:text-bible-gold active:scale-95"
                  >
                    <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
                    <span className="text-sm font-bold">Adicionar seção</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}
        >
          {activeBlock ? (
            <div className="w-full cursor-grabbing opacity-80">
              <BlockRenderer block={activeBlock} isEditing={false} authorName={authorName} canvasWidth={canvasWidth} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

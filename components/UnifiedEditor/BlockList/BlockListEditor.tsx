import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { SortableBlock } from './SortableBlock';
import { GhostBlock } from './GhostBlock';
import { BlockRenderer } from '../../Builder/BlockRenderer';
import { Block } from '../../Builder/types';
import { useAuth } from '../../../contexts/AuthContext';

interface BlockListEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onBlockSelect?: (block: Block | null) => void;
  isEditing?: boolean;
  editor?: any;
}

type GridItem = { type: 'block'; block: Block; id: string } | { type: 'ghost'; id: string; width: string };

export const BlockListEditor: React.FC<BlockListEditorProps> = ({
  blocks,
  onChange,
  onBlockSelect,
  isEditing = true,
  editor
}) => {
  const { currentUser } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNativeDraggingOver, setIsNativeDraggingOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Permite clicar sem disparar drag acidental
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
       const oldIndex = blocks.findIndex((block) => block.id === active.id);
       const overGridIdx = gridItems.findIndex(item => item.id === over.id);
       const overItem = gridItems[overGridIdx];
       
       let newRealIndex = 0;
       for (let i = 0; i < overGridIdx; i++) {
           if (gridItems[i].type === 'block') {
               newRealIndex++;
           }
       }

       let newBlocks = [...blocks];

       // Se for um drop em um GHOST, e o ghost está além do fim do array real
       // ou cria um buraco, precisamos preencher com spacers
       if (overItem.type === 'ghost') {
           const { createBlock } = await import('../../Builder/utils');
           
           // Se estamos movendo um bloco para uma posição que exige spacers antes
           while (newRealIndex > newBlocks.length) {
                const spacer = createBlock('spacer');
                spacer.data.layoutWidth = overItem.width; // Herda a largura do grid
                newBlocks.push(spacer);
           }
           
           // Se estamos movendo para um ghost, e o oldIndex era antes, 
           // o dnd-kit resolve o move, mas como é um ghost (item virtual), 
           // precisamos garantir que o array permita o índice.
           if (newRealIndex >= newBlocks.length) {
               const blockToMove = newBlocks[oldIndex];
               newBlocks.splice(oldIndex, 1);
               newBlocks.push(blockToMove);
               onChange(newBlocks);
           } else {
               onChange(arrayMove(newBlocks, oldIndex, newRealIndex));
           }
       } else {
           onChange(arrayMove(newBlocks, oldIndex, newRealIndex));
       }
    }

    setActiveId(null);
  };

  const handleUpdateBlock = (id: string, newData: any) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, data: { ...block.data, ...newData } } : block
    );
    onChange(newBlocks);
  };

  const handleRemoveBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    onChange(newBlocks);
  };

  const handleDuplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
      const index = blocks.findIndex(b => b.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
    }
  };

  const handleSettings = (block: Block) => {
    onBlockSelect?.(block);
    // Dispara evento para abrir o sheet mobile se necessário
    const event = new CustomEvent('open-mobile-properties', { detail: block });
    window.dispatchEvent(event);
  };

  const handleLayoutWidthChange = (id: string, width: string) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, layoutWidth: width as '1/1' | '1/2' | '1/3' | '2/3', data: { ...block.data, layoutWidth: width } } : block
    );
    onChange(newBlocks);
  };

  const gridItems = useMemo(() => {
    const result: GridItem[] = [];
    let currentRowWidth = 0;
    let rowId = 0;

    const fillRow = (currentWidth: number, targetResult: GridItem[], rId: number) => {
      // Se for 1/2, falta um de 1/2
      if (Math.abs(currentWidth - 0.5) < 0.05) {
        targetResult.push({ type: 'ghost', id: `ghost-${rId}-extra`, width: '1/2' });
      } 
      // Se for 1/3
      else if (Math.abs(currentWidth - 0.33) < 0.05) {
        targetResult.push({ type: 'ghost', id: `ghost-${rId}-1`, width: '1/3' });
        targetResult.push({ type: 'ghost', id: `ghost-${rId}-2`, width: '1/3' });
      }
      else if (Math.abs(currentWidth - 0.66) < 0.1) {
        targetResult.push({ type: 'ghost', id: `ghost-${rId}-1`, width: '1/3' });
      }
    };

    blocks.forEach((block) => {
      const widthStr = block.layoutWidth || block.data?.layoutWidth || '1/1';
      const widthVal = widthStr === '1/1' ? 1 : widthStr === '1/2' ? 0.5 : widthStr === '2/3' ? 0.66 : 0.33;

      if (currentRowWidth + widthVal > 1.05) {
        fillRow(currentRowWidth, result, rowId++);
        currentRowWidth = 0;
      }

      result.push({ type: 'block', block, id: block.id });
      currentRowWidth += widthVal;

      if (currentRowWidth >= 0.95) {
        currentRowWidth = 0;
        rowId++;
      }
    });

    if (currentRowWidth > 0 && currentRowWidth < 0.95) {
      fillRow(currentRowWidth, result, rowId);
    }

    return result;
  }, [blocks]);

  const activeBlock = useMemo(
    () => blocks.find((block) => block.id === activeId),
    [activeId, blocks]
  );

  const handleNativeDrop = (event: React.DragEvent) => {
    setIsNativeDraggingOver(false);
    const blockType = event.dataTransfer.getData('application/x-tiptap-block');
    if (!blockType) return;

    event.preventDefault();
    
    // Encontrar índice de inserção baseado na posição do mouse
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    // Encontrar o bloco mais próximo
    let insertIndex = blocks.length;
    const blockElements = container.querySelectorAll('[data-sortable-id]');
    
    for (let i = 0; i < blockElements.length; i++) {
        const el = blockElements[i] as HTMLElement;
        const elRect = el.getBoundingClientRect();
        
        // Se o mouse está antes do meio do bloco horizontalmente ou verticalmente
        if (y < elRect.top + elRect.height / 2 && x < elRect.right) {
            insertIndex = i;
            break;
        } else if (y < elRect.bottom && x < elRect.left + elRect.width / 2) {
             insertIndex = i;
             break;
        }
    }

    import('../../Builder').then(({ createBlock }) => {
        const newBlock = createBlock(blockType as any);
        const newBlocks = [...blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        onChange(newBlocks);
        
        // Notifica a seleção do novo bloco
        onBlockSelect?.(newBlock);
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (event.dataTransfer.types.includes('application/x-tiptap-block')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setIsNativeDraggingOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    setIsNativeDraggingOver(false);
  };

  return (
    <div 
        className={`w-full max-w-5xl mx-auto py-8 min-h-[500px] transition-all duration-300 rounded-3xl ${
          isNativeDraggingOver ? 'bg-bible-gold/5 ring-4 ring-bible-gold/20 ring-inset' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleNativeDrop}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <SortableContext
          items={gridItems.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap w-full -mx-1">
            {gridItems.map((item) => {
              if (item.type === 'ghost') {
                return (
                  <GhostBlock 
                    key={item.id} 
                    id={item.id} 
                    width={item.width} 
                    onAdd={(type, selectedWidth) => {
                        import('../../Builder').then(({ createBlock }) => {
                            const nextWidth = (selectedWidth || item.width) as '1/1' | '1/2' | '1/3' | '2/3';
                            const newBlock = createBlock(type as any);
                            newBlock.layoutWidth = nextWidth;
                            newBlock.data = { ...newBlock.data, layoutWidth: nextWidth };
                            
                            // Encontrar o índice correto de inserção
                            const ghostIdx = gridItems.findIndex(gi => gi.id === item.id);
                            // Mapear posição grid para posição real no array blocks
                            let realIdx = 0;
                            for (let i = 0; i < ghostIdx; i++) {
                                if (gridItems[i].type === 'block') realIdx++;
                            }
                            
                            const newBlocks = [...blocks];
                            newBlocks.splice(realIdx, 0, newBlock);
                            onChange(newBlocks);
                            onBlockSelect?.(newBlock);
                        });
                    }}
                  />
                );
              }

              const { block } = item;
              return (
                <SortableBlock
                  key={block.id}
                  id={block.id}
                  layoutWidth={block.layoutWidth || block.data?.layoutWidth || '1/1'}
                  isEditing={isEditing}
                  onRemove={() => handleRemoveBlock(block.id)}
                  onDuplicate={() => handleDuplicateBlock(block.id)}
                  onSettings={() => handleSettings(block)}
                  onLayoutWidthChange={(w) => handleLayoutWidthChange(block.id, w)}
                >
                  <div data-sortable-id={block.id}>
                      <BlockRenderer
                        block={block}
                        isEditing={isEditing}
                        onUpdate={handleUpdateBlock}
                        authorName={currentUser?.displayName || ''}
                        editor={editor}
                        layoutWidth={block.data?.layoutWidth || '1/1'}
                      />
                  </div>
                </SortableBlock>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId && activeBlock ? (
            <div className="w-full opacity-80 cursor-grabbing">
               <BlockRenderer
                  block={activeBlock}
                  isEditing={false}
                  authorName={currentUser?.displayName || ''}
                />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

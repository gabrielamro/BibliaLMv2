import { NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  GripVertical,
  Italic,
  Link,
  Settings2,
  Trash2,
  Type,
  Underline,
  Columns,
  Plus,
} from 'lucide-react';
import { BlockRenderer } from '../../Builder/BlockRenderer';
import { useAuth } from '../../../contexts/AuthContext';
import { blockLabels } from '../../Builder/constants';
import type { BlockType } from '../../Builder/types';
import { BlockPickerMenu } from './BlockPickerMenu';

const widthToClass: Record<string, string> = {
  '1/1': 'w-full',
  '2/3': 'w-2/3',
  '1/2': 'w-1/2',
  '1/3': 'w-1/3',
};

export const BlockNodeView = (props: any) => {
  const { currentUser } = useAuth();
  const blockData = props.node.attrs.blockData;
  const layoutWidth = props.node.attrs.layoutWidth || '1/1';
  const isSelected = props.selected;
  const [ghostDragOver, setGhostDragOver] = useState<number | null>(null);
  const [activeGhostPicker, setActiveGhostPicker] = useState<number | null>(null);
  const [isTextToolboxOpen, setIsTextToolboxOpen] = useState(false);

  const handleUpdate = (_id: string, newData: any) => {
    props.updateAttributes({
      blockData: {
        ...blockData,
        data: {
          ...blockData.data,
          ...newData,
        },
      },
    });
  };

  const handleDuplicate = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const { editor, node, getPos } = props;
    const pos = getPos();
    editor.commands.insertContentAt(pos + node.nodeSize, node.toJSON());
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    props.deleteNode();
  };

  const setWidth = (width: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    props.updateAttributes({ layoutWidth: width });
  };

  const setAlign = (align: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    props.updateAttributes({ layoutAlign: align });
  };

  const runInlineCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'formatSetBlockText' }));
    activeElement?.focus();
  };

  const changeFontSize = (delta: number) => {
    const selection = window.getSelection();
    const target = document.activeElement as HTMLElement | null;
    if (!selection || selection.rangeCount === 0 || !target) return;

    const range = selection.getRangeAt(0);
    const currentElement = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer as HTMLElement
      : range.commonAncestorContainer.parentElement;
    const computedSize = currentElement ? parseFloat(window.getComputedStyle(currentElement).fontSize) : 16;
    const nextSize = Math.min(72, Math.max(10, Math.round(computedSize + delta)));

    if (selection.isCollapsed) {
      target.style.fontSize = `${nextSize}px`;
    } else {
      const span = document.createElement('span');
      span.style.fontSize = `${nextSize}px`;
      range.surroundContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'formatFontSize' }));
    target.focus();
  };

  const promptForLink = () => {
    const url = window.prompt('URL do link');
    if (!url) return;
    runInlineCommand('createLink', url);
  };

  const openTextToolboxForTarget = (target: EventTarget | null) => {
    if (!props.editor.isEditable || !(target instanceof HTMLElement)) return;
    if (target.closest('.rtb-editor')) return;
    if (target.isContentEditable || target.matches('input, textarea')) {
      setIsTextToolboxOpen(true);
    }
  };

  if (!blockData) return null;

  const widthClass = widthToClass[layoutWidth] || 'w-full';
  const blockInfo = blockLabels[blockData.type as keyof typeof blockLabels];

  const handleAddNew = (type: BlockType, nextLayoutWidth?: '1/3' | '1/2' | '2/3' | '1/1') => {
    import('../../Builder').then(({ createBlock }) => {
      const newBlock = createBlock(type);
      const targetWidth = nextLayoutWidth || layoutWidth;

      if (type === 'spacer') {
        newBlock.data = {
          ...newBlock.data,
          layoutWidth: targetWidth,
        };
      }

      const { editor, getPos, node } = props;
      editor.commands.insertContentAt(getPos() + node.nodeSize, {
        type: 'customBlock',
        attrs: { blockData: newBlock, layoutWidth: targetWidth },
      });

      setActiveGhostPicker(null);
    });
  };

  const handleGhostDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setGhostDragOver(null);

    const { editor, getPos, node } = props;
    const view = editor.view;
    const blockType = event.dataTransfer?.getData('application/x-tiptap-block');

    if (blockType) {
      handleAddNew(blockType as BlockType);
      return;
    }

    const dragging = view.dragging;
    if (!dragging) return;

    const { slice, move } = dragging;
    const content = slice.content;
    if (content.childCount === 0) return;

    const draggedNode = content.firstChild!;
    const insertPos = getPos() + node.nodeSize;
    const newAttrs = { ...draggedNode.attrs, layoutWidth };
    const newNode = draggedNode.type.create(newAttrs, draggedNode.content, draggedNode.marks);

    let tr = view.state.tr;

    if (move) {
      let sourcePos = -1;
      let sourceSize = 0;
      view.state.doc.descendants((candidate: any, pos: number) => {
        if (sourcePos === -1 && candidate.type.name === 'customBlock' && candidate.attrs.blockData?.id === draggedNode.attrs.blockData?.id) {
          sourcePos = pos;
          sourceSize = candidate.nodeSize;
          return false;
        }
      });

      if (sourcePos !== -1) {
        tr = tr.delete(sourcePos, sourcePos + sourceSize);
        const adjustedPos = sourcePos < insertPos ? insertPos - sourceSize : insertPos;
        tr = tr.insert(adjustedPos, newNode);
      } else {
        tr = tr.insert(insertPos, newNode);
      }
    } else {
      tr = tr.insert(insertPos, newNode);
    }

    view.dispatch(tr);
    view.dragging = null;
  };

  // Calcular quantos ghost slots cabem com base nos vizinhos na mesma "linha"
  const widthFraction = (lw: string): number => {
    if (lw === '1/1') return 1;
    if (lw === '2/3') return 2/3;
    if (lw === '1/2') return 1/2;
    if (lw === '1/3') return 1/3;
    return 1;
  };

  const calcGhostInfo = (): { count: number; slotWidth: string } => {
    if (layoutWidth === '1/1') return { count: 0, slotWidth: '1/1' };

    const { editor, getPos } = props;
    const doc = editor.state.doc;
    const myPos = getPos();
    const myFraction = widthFraction(layoutWidth);

    // Percorrer os nós vizinhos para descobrir o que está na mesma "linha"
    // Uma "linha" é um grupo consecutivo de blocos cuja soma de frações <= 1.0
    let rowStart = -1;
    let rowSum = 0;
    let myRowSum = 0;
    let foundMyRow = false;

    doc.forEach((node: any, offset: number) => {
      if (foundMyRow) return; // Já achamos nossa linha
      const nw = widthFraction(node.attrs.layoutWidth || '1/1');

      if (nw === 1) {
        // Bloco 1/1 sempre inicia e completa uma linha sozinho
        if (offset === myPos) {
          myRowSum = 1;
          foundMyRow = true;
        }
        rowSum = 0; // Reset para próxima linha
        return;
      }

      // Se adicionar este bloco excede 1.0, começa nova linha
      if (rowSum + nw > 1.001) {
        rowSum = 0;
      }

      rowSum += nw;

      if (offset === myPos) {
        // Encontrei meu bloco - continuo para contar o total da minha linha
        myRowSum = rowSum;
        // Continua para ver se há mais blocos nesta linha
        foundMyRow = false;
      }
    });

    // Re-calcular: varrer novamente identificando a linha completa do bloco selecionado
    let currentRowBlocks: number[] = [];
    let currentRowTotal = 0;
    let myRowTotal = 0;
    let myRowBlockCount = 0;
    let foundRow = false;

    doc.forEach((node: any, offset: number) => {
      const nw = widthFraction(node.attrs.layoutWidth || '1/1');

      if (nw === 1) {
        if (currentRowBlocks.includes(myPos)) {
          // Este bloco 1/1 está na minha "linha" mas ele é sozinho
          myRowTotal = 1;
          myRowBlockCount = 1;
          foundRow = true;
        }
        currentRowBlocks = [];
        currentRowTotal = 0;
        if (offset === myPos) {
          myRowTotal = 1;
          myRowBlockCount = 1;
          foundRow = true;
        }
        return;
      }

      if (currentRowTotal + nw > 1.001) {
        // Linha anterior está completa
        if (currentRowBlocks.includes(myPos)) {
          myRowTotal = currentRowTotal;
          myRowBlockCount = currentRowBlocks.length;
          foundRow = true;
        }
        currentRowBlocks = [];
        currentRowTotal = 0;
      }

      currentRowBlocks.push(offset);
      currentRowTotal += nw;
    });

    // Checar a última linha
    if (!foundRow && currentRowBlocks.includes(myPos)) {
      myRowTotal = currentRowTotal;
      myRowBlockCount = currentRowBlocks.length;
    }

    const remaining = Math.max(0, 1 - myRowTotal);

    // Quantos slots de 1/3 cabem no espaço restante?
    if (remaining < 0.30) return { count: 0, slotWidth: '1/3' }; // Menos que 1/3, sem slots
    if (remaining < 0.45) return { count: 1, slotWidth: '1/3' }; // Cabe 1 slot de 1/3
    if (remaining < 0.60) return { count: 1, slotWidth: '1/2' }; // Cabe 1 slot de 1/2
    return { count: Math.min(Math.floor(remaining / (1/3)), 2), slotWidth: '1/3' }; // Cabe 1-2 slots de 1/3
  };

  const ghostInfo = isSelected && props.editor.isEditable ? calcGhostInfo() : { count: 0, slotWidth: '1/3' };
  const ghostCount = ghostInfo.count;
  const ghostSlotWidth = ghostInfo.slotWidth;
  const ghostContainerWidth = ghostCount === 2 ? '200%' : '100%';

  return (
    <NodeViewWrapper
      draggable={!props.editor.isEditable ? 'false' : 'true'}
      data-type="custom-block"
      layoutwidth={layoutWidth}
      layoutalign={props.node.attrs.layoutAlign || 'left'}
      className={`custom-block-outer relative group box-border px-1 transition-all duration-300 w-full ${isSelected ? 'z-[60]' : 'z-auto'}`}
      onFocusCapture={(event: React.FocusEvent<HTMLElement>) => openTextToolboxForTarget(event.target)}
      onMouseDownCapture={(event: React.MouseEvent<HTMLElement>) => openTextToolboxForTarget(event.target)}
      onBlurCapture={(event: React.FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        window.setTimeout(() => setIsTextToolboxOpen(false), 80);
      }}
    >
      <div className={`w-full transition-all duration-300 ${isSelected && props.editor.isEditable ? 'relative rounded-2xl ring-2 ring-bible-gold shadow-2xl' : 'ring-transparent'}`}>


        {props.editor.isEditable && (
          <div 
            data-drag-handle
            className="absolute -left-10 top-1/2 hidden -translate-y-1/2 cursor-grab items-center justify-center p-2 text-gray-400 opacity-0 transition-opacity hover:text-bible-gold active:cursor-grabbing lg:flex lg:group-hover:opacity-100"
          >
            <GripVertical size={20} />
          </div>
        )}

        {isSelected && props.editor.isEditable && (
          <div className="pointer-events-none absolute inset-0 z-[70] animate-in fade-in duration-300">
            <button
              onClick={handleRemove}
              className="pointer-events-auto absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 active:scale-90"
            >
              <Trash2 size={14} />
            </button>

            <div className="pointer-events-auto absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-gray-100 bg-white p-1 shadow-lg">
              {['1/3', '1/2', '2/3', '1/1'].map((option) => (
                <button
                  key={option}
                  onClick={(event) => setWidth(option, event)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${layoutWidth === option ? 'bg-bible-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {option}
                </button>
              ))}
              {layoutWidth !== '1/1' && (
                <>
                  <div className="mx-1 h-4 w-px bg-gray-200" />
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={(event) => setAlign(align, event)}
                      className={`rounded-full px-2 py-1 text-[10px] font-bold transition-colors uppercase ${props.node.attrs.layoutAlign === align ? 'bg-bible-ink text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                    </button>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={handleDuplicate}
              className="pointer-events-auto absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 active:scale-90"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-mobile-properties', { detail: blockData }));
              }}
              className="pointer-events-auto absolute -bottom-5 left-1/2 -translate-x-1/2 flex h-8 px-4 items-center justify-center rounded-full bg-bible-gold text-white shadow-xl transition-all hover:bg-bible-gold/90 z-[75] border-2 border-white font-black text-[10px] gap-2"
            >
              <Settings2 size={12} />
              CONFIGURAR
            </button>
          </div>
        )}

        {props.editor.isEditable && isTextToolboxOpen && (
          <div
            data-testid="inline-text-toolbox"
            className="absolute left-1/2 top-3 z-[90] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {[
              { label: 'Negrito', icon: Bold, command: 'bold' },
              { label: 'Italico', icon: Italic, command: 'italic' },
              { label: 'Sublinhado', icon: Underline, command: 'underline' },
              { label: 'Alinhar esquerda', icon: AlignLeft, command: 'justifyLeft' },
              { label: 'Centralizar', icon: AlignCenter, command: 'justifyCenter' },
              { label: 'Alinhar direita', icon: AlignRight, command: 'justifyRight' },
              { label: 'Justificar', icon: AlignJustify, command: 'justifyFull' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.command}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold"
                  onClick={() => runInlineCommand(item.command)}
                >
                  <Icon size={15} />
                </button>
              );
            })}
            <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              type="button"
              title="Diminuir fonte"
              aria-label="Diminuir fonte"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold"
              onClick={() => changeFontSize(-2)}
            >
              <Type size={13} />
            </button>
            <button
              type="button"
              title="Aumentar fonte"
              aria-label="Aumentar fonte"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold"
              onClick={() => changeFontSize(2)}
            >
              <Type size={18} />
            </button>
            <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              type="button"
              title="Inserir link"
              aria-label="Inserir link"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-bible-gold/10 hover:text-bible-gold"
              onClick={promptForLink}
            >
              <Link size={15} />
            </button>
          </div>
        )}

        <BlockRenderer
          block={blockData}
          isEditing={props.editor.isEditable}
          onUpdate={handleUpdate}
          authorName={currentUser?.displayName || ''}
          editor={props.editor}
          layoutWidth={layoutWidth}
          canvasWidth={props.editor.storage.customBlock.canvasWidth}
          studyId={props.editor.storage.customBlock.studyId}
          studyTitle={props.editor.storage.customBlock.studyTitle}
        />
      </div>

      {isSelected && props.editor.isEditable && ghostCount > 0 && (
        <div className="absolute left-full top-0 z-[80] flex gap-2 px-1 animate-in fade-in slide-in-from-left-4 duration-300" style={{ width: ghostContainerWidth }}>
          {Array.from({ length: ghostCount }).map((_, index) => (
            <div
              key={index}
              data-testid={`node-ghost-slot-${index}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveGhostPicker((current) => (current === index ? null : index));
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = 'move';
                setGhostDragOver(index);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setGhostDragOver(index);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setGhostDragOver(null);
              }}
              onDrop={handleGhostDrop}
              className={`group/ghost relative flex min-h-[180px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                ghostDragOver === index
                  ? 'scale-[0.97] border-bible-gold bg-bible-gold/15 shadow-xl shadow-bible-gold/20 ring-2 ring-bible-gold/30'
                  : 'border-bible-gold/20 bg-gradient-to-br from-bible-gold/5 via-transparent to-bible-gold/3 hover:border-bible-gold/40 hover:bg-bible-gold/10 hover:shadow-lg'
              }`}
            >
              <div
                data-testid={`ghost-insertion-line-${index}`}
                className={`pointer-events-none absolute left-4 right-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-bible-gold shadow-[0_0_18px_rgba(212,160,23,0.35)] transition-all ${
                  ghostDragOver === index ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0'
                }`}
              />
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition-all duration-300 ${
                  ghostDragOver === index
                    ? 'scale-125 bg-bible-gold text-white'
                    : 'bg-white/80 text-bible-gold/50 group-hover/ghost:scale-110 group-hover/ghost:rotate-90 group-hover/ghost:text-bible-gold'
                }`}
              >
                {ghostDragOver === index ? <Plus size={22} strokeWidth={3} /> : <Columns size={20} />}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                  ghostDragOver === index ? 'text-bible-gold' : 'text-bible-gold/40 group-hover/ghost:text-bible-gold/70'
                }`}>
                  {ghostDragOver === index ? 'Soltar Aqui' : 'Slot Vazio'}
                </span>
                <span className={`text-[11px] font-bold transition-colors ${
                  ghostDragOver === index ? 'text-bible-gold' : 'text-gray-400 group-hover/ghost:text-bible-gold'
                }`}>
                  {ghostSlotWidth} Grid
                </span>
              </div>

              {activeGhostPicker === index && (
                <div
                  data-testid={`ghost-picker-${index}`}
                  className="absolute inset-0 z-10 rounded-2xl border border-bible-gold/30 bg-white/98 p-3 shadow-2xl backdrop-blur"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <BlockPickerMenu compact testId={`ghost-picker-menu-${index}`} onSelect={(type, width) => handleAddNew(type, width)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
};

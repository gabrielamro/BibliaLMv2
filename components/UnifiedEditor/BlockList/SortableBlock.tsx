import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Type,
  Settings2,
  Trash2,
  Underline,
} from 'lucide-react';

interface SortableBlockProps {
  id: string;
  children: React.ReactNode;
  layoutWidth?: string;
  layoutPercent?: number;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onSettings?: () => void;
  onLayoutWidthChange?: (width: string) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
}

export const SortableBlock: React.FC<SortableBlockProps> = ({ 
  id, 
  children, 
  layoutWidth = '1/1',
  layoutPercent,
  onRemove,
  onDuplicate,
  onSettings,
  onLayoutWidthChange,
  onSelect,
  isSelected = false,
  isEditing = true,
  canvasWidth = 'desktop'
}) => {
  const [isTextToolboxOpen, setIsTextToolboxOpen] = React.useState(false);
  const isMobileCanvas = canvasWidth === 'mobile';
  const effectiveLayoutWidth = isMobileCanvas ? '1/1' : layoutWidth;
  const mobileControlsClass = isSelected ? 'opacity-100' : 'pointer-events-none opacity-0';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${
      isMobileCanvas
        ? 12
        : layoutWidth === '2/3'
          ? 8
          : layoutWidth === '1/2'
            ? 6
            : layoutWidth === '1/3'
              ? 4
              : 12
    } / span ${
      isMobileCanvas
        ? 12
        : layoutWidth === '2/3'
          ? 8
          : layoutWidth === '1/2'
            ? 6
            : layoutWidth === '1/3'
              ? 4
              : 12
    }`,
  };

  const widthClass = 'w-full';

  const openTextToolboxForTarget = (target: EventTarget | null) => {
    if (!isEditing || !(target instanceof HTMLElement)) return;
    if (target.closest('.rtb-editor')) return;
    if (target.isContentEditable || target.matches('input, textarea')) {
      setIsTextToolboxOpen(true);
    }
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="sortable-block"
      data-layout-width={effectiveLayoutWidth}
      className={`relative group flex min-w-0 transition-all duration-300 box-border ${widthClass}`}
      onClick={() => onSelect?.()}
      onFocusCapture={(event) => openTextToolboxForTarget(event.target)}
      onMouseDownCapture={(event) => openTextToolboxForTarget(event.target)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        window.setTimeout(() => setIsTextToolboxOpen(false), 80);
      }}
    >
      <div className={`relative flex w-full rounded-2xl transition-all duration-300 ${isEditing ? 'hover:ring-2 hover:ring-bible-gold/30' : ''}`}>
        
        {/* Drag Handle & Label */}
        {isEditing && !isMobileCanvas && (
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
          <div className={`absolute -top-2 -right-2 flex gap-1 transition-opacity z-50 ${isMobileCanvas ? mobileControlsClass : 'opacity-0 group-hover:opacity-100'}`}>
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

        {/* Bottom Right: Size Options */}
        {isEditing && !isMobileCanvas && (
          <div className={`absolute bottom-3 right-3 transition-all bg-white rounded-full shadow-lg flex items-center gap-1 p-1 z-50 border border-gray-100 ${isMobileCanvas ? mobileControlsClass : 'opacity-0 group-hover:opacity-100'}`}>
             {[
                 { label: '1/3', value: '1/3' },
                 { label: '1/2', value: '1/2' },
                 { label: '2/3', value: '2/3' },
                 { label: '1/1', value: '1/1' },
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={(e) => { e.stopPropagation(); onLayoutWidthChange?.(opt.value); }}
                   className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${layoutWidth === opt.value ? 'bg-bible-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                 >
                   {opt.label}
                 </button>
               ))
             }
          </div>
        )}

        {/* Content Container */}
        <div className={`flex h-full w-full ${isDragging ? 'pointer-events-none' : ''}`}>
          {children}
        </div>

        {/* Quick Settings Bar (Bottom) */}
        {isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); onSettings?.(); }}
            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 transition-all bg-bible-gold text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl flex items-center gap-2 hover:bg-bible-gold/90 z-[60] border-2 border-white ${isMobileCanvas ? mobileControlsClass : 'opacity-0 group-hover:opacity-100'}`}
          >
            <Settings2 size={12} />
            CONFIGURAR
          </button>
        )}

        {isEditing && isTextToolboxOpen && (
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
      </div>
    </div>
  );
};

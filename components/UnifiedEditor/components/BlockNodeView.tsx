import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Settings2, Copy, Trash2, GripVertical } from 'lucide-react';
import { BlockRenderer } from '../../Builder/BlockRenderer';

export const BlockNodeView = (props: any) => {
  const blockData = props.node.attrs.blockData;
  const isSelected = props.selected;

  const handleUpdate = (id: string, newData: any) => {
    props.updateAttributes({
      blockData: {
        ...blockData,
        data: {
          ...blockData.data,
          ...newData
        }
      }
    });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { editor, node, getPos } = props;
    const pos = getPos();
    editor.commands.insertContentAt(pos + node.nodeSize, node.toJSON());
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.deleteNode();
  };

  if (!blockData) return null;

  return (
    <NodeViewWrapper draggable="true" data-drag-handle="true" className={`custom-block-wrapper relative group transition-all duration-300 ${isSelected ? 'z-[60]' : 'z-auto'}`}>
       {/* Drag Handle Desktop */}
       <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-bible-gold hidden lg:flex">
         <GripVertical size={20} />
       </div>

       {/* Corner Actions (Visible when selected or hover on desktop) */}
       {(isSelected) && (
         <div className="absolute inset-0 pointer-events-none z-[70] animate-in fade-in duration-300">
            {/* Top Right: Delete */}
            <button
               onClick={handleRemove}
               className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-red-600 active:scale-90 transition-all"
               title="Remover Bloco"
            >
               <Trash2 size={14} />
            </button>

            {/* Bottom Right: Duplicate */}
            <button
               onClick={handleDuplicate}
               className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-blue-700 active:scale-90 transition-all"
               title="Duplicar Bloco"
            >
               <Copy size={14} />
            </button>

            {/* Bottom Left: Settings/Edit */}
            <button
               onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // A seleção já abre as propriedades via UnifiedEditor.onSelectionUpdate
                  // Mas podemos forçar o evento de abrir painel mobile se necessário
                  const event = new CustomEvent('open-mobile-properties', { detail: blockData });
                  window.dispatchEvent(event);
               }}
               className="absolute -bottom-3 -left-3 w-8 h-8 bg-bible-gold text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-bible-gold/90 active:scale-90 transition-all"
               title="Editar Propriedades"
            >
               <Settings2 size={14} />
            </button>
         </div>
       )}

       <div className={`ring-2 rounded-2xl transition-all duration-300 ${isSelected ? 'ring-bible-gold shadow-2xl' : 'ring-transparent hover:ring-bible-gold/30'}`}>
         <BlockRenderer 
           block={blockData} 
           isEditing={true} 
           onUpdate={handleUpdate}
           canvasWidth="desktop" 
         />
       </div>
    </NodeViewWrapper>
  );
};

import React, { useState } from 'react';
import { Editor } from '@tiptap/core';
import { FloatingMenu } from '@tiptap/react/menus';
import { Plus, LayoutTemplate, User, BookOpen, Video, Layers, Sparkle, Play } from 'lucide-react';
import { blockLabels } from '../../Builder/constants';
import { BlockType } from '../../Builder/types';

interface EditorFloatingMenuProps {
  editor: Editor;
}

export const EditorFloatingMenu: React.FC<EditorFloatingMenuProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const insertBlock = (type: BlockType) => {
    import('../../Builder').then(({ createBlock }) => {
      const newBlock = createBlock(type);
      editor.chain().focus().insertContent({
        type: 'customBlock',
        attrs: { blockData: newBlock }
      }).run();
      setIsOpen(false);
    });
  };

  return (
    <FloatingMenu editor={editor} tippyOptions={{ duration: 100, placement: 'right' }} className="flex relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 transition-all -ml-12"
      >
        <Plus size={18} className={`transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-0 left-10 w-64 bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden py-2 animate-in fade-in slide-in-from-left-2">
          <div className="px-3 py-1 pb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inserir Bloco</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto px-1 space-y-1">
            {(Object.keys(blockLabels) as BlockType[]).filter(t => t !== 'study-content').map((type) => (
              <button
                key={type}
                onClick={() => insertBlock(type)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-left"
              >
                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${blockLabels[type].color}`}>
                  {type === 'hero' && <LayoutTemplate size={14} />}
                  {type === 'authority' && <User size={14} />}
                  {type === 'biblical' && <BookOpen size={14} />}
                  {type === 'video' && <Video size={14} />}
                  {type === 'footer' && <Layers size={14} />}
                  {type === 'study-content' && <Sparkle size={14} />}
                  {type === 'slide' && <Play size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{blockLabels[type].label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{blockLabels[type].description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </FloatingMenu>
  );
};

import React from 'react';
import { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Quote } from 'lucide-react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-1 z-50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Negrito"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Itálico"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('strike') ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>
      
      <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 my-1"></div>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md ${editor.isActive('blockquote') ? 'bg-gray-100 dark:bg-gray-700 text-bible-gold' : 'text-gray-600 dark:text-gray-300'}`}
        title="Citação"
      >
        <Quote size={16} />
      </button>
    </BubbleMenu>
  );
};

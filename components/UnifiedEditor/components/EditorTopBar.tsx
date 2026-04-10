import React from 'react';
import { Editor } from '@tiptap/core';
import { 
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Link as LinkIcon, Unlink, Eraser
} from 'lucide-react';

interface EditorTopBarProps {
  editor: Editor;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({ editor }) => {
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    title, 
    children 
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-all flexitems-center justify-center ${
        isActive 
          ? 'bg-gray-200 dark:bg-gray-700 text-bible-gold dark:text-bible-gold' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
        <Redo size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Título 1">
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2">
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3">
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito">
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico">
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado">
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Tachado">
        <Strikethrough size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Código embutido">
        <Code size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Limpar Formatação">
        <Eraser size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Alinhar à Esquerda">
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centralizar">
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Alinhar à Direita">
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justificar">
        <AlignJustify size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista com Marcadores">
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista Numerada">
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citação">
        <Quote size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Adicionar/Editar Link">
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} title="Remover Link">
        <Unlink size={16} />
      </ToolbarButton>
    </div>
  );
}

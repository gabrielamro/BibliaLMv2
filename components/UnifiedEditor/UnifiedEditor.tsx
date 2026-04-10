import React, { useEffect } from 'react';
import { useEditor, EditorContent, generateJSON } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Focus from '@tiptap/extension-focus';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { BlockExtension } from './extensions/BlockExtension';
import { EditorBubbleMenu } from './components/EditorBubbleMenu';
import { EditorFloatingMenu } from './components/EditorFloatingMenu';
import { EditorTopBar } from './components/EditorTopBar';
import { Plugin, PluginKey } from '@tiptap/pm/state';

interface UnifiedEditorProps {
  content: string | Record<string, any>;
  onChange: (json: any, html: string) => void;
  onBlockSelect?: (blockData: any | null) => void;
  readOnly?: boolean;
}

export interface UnifiedEditorRef {
  insertBlock: (type: string) => void;
  updateBlock: (id: string, data: any) => void;
  removeBlock: (id: string) => void;
}

export const UnifiedEditor = React.forwardRef<UnifiedEditorRef, UnifiedEditorProps>(({ content, onChange, onBlockSelect, readOnly = false }, ref) => {
  const parsedContent = React.useMemo(() => {
    if (Array.isArray(content)) {
      if (content.length === 0) return '';
      return {
        type: 'doc',
        content: content.flatMap(block => {
          if (block.type === 'study-content') {
             const html = block.data?.content || `
               <p>Relatório Teológico Alpha</p>
               <h1>A Revelação Plena</h1>
               <h2>1. O Despertar</h2>
               <p>Apresente o tema com autoridade. Situe o leitor na jornada que ele está prestes a trilhar e ancore a mensagem na urgência espiritual do momento.</p>
               <h2>2. As Raízes da Verdade</h2>
               <p>Explore o "porquê" por trás dos versículos. Traga à luz os significados ocultos pelo tempo e as conexões entre o Antigo e o Novo Testamento.</p>
               <h2>3. O Caminho Prático</h2>
               <p>Como essa verdade altera sua rotina amanhã às 8h? Seja incisivo, prático e pastoral ao traduzir o céu para a terra.</p>
               <h2>4. Clamor e Resposta</h2>
               <p>Uma oração de entrega e alinhamento com a vontade do Criador.</p>
               <h2>5. O Chamado Final</h2>
               <p>Um ponto final que é, na verdade, um novo começo. O que o leitor deve levar consigo para o resto da vida?</p>
             `;
             const jsonAst = generateJSON(html, [StarterKit]);
             return jsonAst.content || [];
          }
          return [{
            type: 'customBlock',
            attrs: { blockData: block }
          }];
        })
      };
    }
    return content;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Digite "/" para menus, escreva ou arraste um bloco do painel lateral...',
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount,
      BlockExtension,
    ],
    content: parsedContent,
    autofocus: false,
    immediatelyRender: false,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      if (onBlockSelect && editor.isFocused) {
        const { selection } = editor.state;
        const node = editor.state.doc.nodeAt(selection.from);
        if (node && node.type.name === 'customBlock') {
          onBlockSelect(node.attrs.blockData);
        } else {
          onBlockSelect(null);
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-bible-gold focus:outline-none min-h-[500px] max-w-none px-4',
      },
      handleDrop: (view, event, slice, moved) => {
        const blockType = event.dataTransfer?.getData('application/x-tiptap-block');
        if (blockType) {
          event.preventDefault();
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (coordinates) {
            import('../../components/Builder').then(({ createBlock }) => {
                const newBlock = createBlock(blockType as any);
                view.dispatch(
                  view.state.tr.insert(coordinates.pos, view.state.schema.nodes.customBlock.create({
                    blockData: newBlock
                  }))
                );
            });
          }
          return true;
        }
        return false; // let tip-tap handle normal text drop
      }
    },
  });

  // Sincronizar conteúdo inicial (útil para templates que carregam após a montagem)
  useEffect(() => {
    if (editor && parsedContent && editor.isEmpty) {
      const isDoc = typeof parsedContent === 'object' && parsedContent.type === 'doc';
      const hasContent = isDoc && parsedContent.content?.length > 0;
      
      if (hasContent) {
        setTimeout(() => {
          if (!editor.isDestroyed && editor.isEmpty) {
            editor.commands.setContent(parsedContent, false); // false para não disparar update circular
            // Não limpamos o history aqui para evitar o bug de comandos ausentes,
            // mas o setContent inicial no editor vazio geralmente se torna o baseline.
          }
        }, 10);
      }
    }
  }, [editor, parsedContent]);


  React.useImperativeHandle(ref, () => ({
    insertBlock: (blockType: string) => {
      import('../../components/Builder').then(({ createBlock }) => {
        const newBlock = createBlock(blockType as any);
        editor.chain().focus().insertContent({
          type: 'customBlock',
          attrs: { blockData: newBlock }
        }).run();
      });
    },
    updateBlock: (id: string, data: any) => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'customBlock' && node.attrs.blockData?.id === id) {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              blockData: {
                ...node.attrs.blockData,
                data: {
                  ...node.attrs.blockData.data,
                  ...data
                }
              }
            });
            return true;
          });
          return false; // Break loop
        }
        return true;
      });
    },
    removeBlock: (id: string) => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'customBlock' && node.attrs.blockData?.id === id) {
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
          return false;
        }
        return true;
      });
    }
  }), [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="unified-editor-container bg-white dark:bg-gray-900 w-full mx-auto relative flex flex-col min-h-screen">
      {!readOnly && editor && <EditorTopBar editor={editor} />}
      {!readOnly && editor && <EditorBubbleMenu editor={editor} />}
      {!readOnly && editor && <EditorFloatingMenu editor={editor} />}
      
      <div className="max-w-4xl mx-auto pt-8 pb-32 px-4 relative w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

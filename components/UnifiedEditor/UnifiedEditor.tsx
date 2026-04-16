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
import { BlockListEditor } from './BlockList/BlockListEditor';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Block, BlockType } from '../Builder/types';
import { BlockPickerMenu } from './components/BlockPickerMenu';
import { Plus } from 'lucide-react';

interface UnifiedEditorProps {
  content: string | Record<string, any>;
  onChange: (json: any, html: string) => void;
  onBlockSelect?: (blockData: any | null) => void;
  readOnly?: boolean;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
  studyId?: string;
  studyTitle?: string;
}

export interface UnifiedEditorRef {
  insertBlock: (type: string) => void;
  updateBlock: (id: string, data: any) => void;
  removeBlock: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

export const UnifiedEditor = React.forwardRef<UnifiedEditorRef, UnifiedEditorProps>(({ content, onChange, onBlockSelect, readOnly = false, canvasWidth = 'desktop', studyId, studyTitle }, ref) => {
  const [isEndPickerOpen, setIsEndPickerOpen] = React.useState(false);
  const parsedContent = React.useMemo(() => {
    if (Array.isArray(content)) {
      if (content.length === 0) return '';
      return {
        type: 'doc',
        content: content.map(block => ({
          type: 'customBlock',
          attrs: { 
            blockData: block,
            layoutWidth: block.layoutWidth || '1/1'
          }
        }))
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
        class: `prose prose-lg dark:prose-invert focus:outline-none max-w-none font-serif text-bible-ink dark:text-gray-200 prose-headings:font-epic prose-headings:font-normal prose-headings:text-bible-gold prose-h1:text-4xl prose-h1:text-center prose-h2:text-2xl prose-a:text-bible-gold prose-blockquote:border-l-bible-gold prose-blockquote:bg-bible-gold/5 prose-blockquote:px-6 py-2 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-bible-ink/80 dark:prose-blockquote:text-white/80 ${!readOnly ? 'min-h-[500px]' : ''
          } px-0`,
      },
      handleDrop: (view, event, slice, moved) => {
        const blockType = event.dataTransfer?.getData('application/x-tiptap-block');
        if (blockType) {
          event.preventDefault();
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

          if (coordinates) {
            import('../../components/Builder').then(({ createBlock }) => {
              const newBlock = createBlock(blockType as any);
              const { schema, tr } = view.state;

              // Insere o bloco e um parágrafo vazio logo após
              view.dispatch(
                tr.insert(coordinates.pos, [
                  schema.nodes.customBlock.create({ blockData: newBlock }),
                  schema.nodes.paragraph.create()
                ])
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

  // Sincronizar o estado readOnly com a API do TipTap
  useEffect(() => {
    if (editor && editor.isEditable === readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Sincronizar canvasWidth + studyId/studyTitle com o storage da extensão
  useEffect(() => {
    if (editor && (editor.storage as any).customBlock) {
      (editor.storage as any).customBlock.canvasWidth = canvasWidth;
      (editor.storage as any).customBlock.studyId = studyId || '';
      (editor.storage as any).customBlock.studyTitle = studyTitle || '';
    }
  }, [editor, canvasWidth, studyId, studyTitle]);


  React.useImperativeHandle(ref, () => ({
    insertBlock: (blockType: string) => {
      import('../../components/Builder').then(({ createBlock }) => {
        const newBlock = createBlock(blockType as any);

        if (Array.isArray(content)) {
          // React Array Mode
          onChange([...content, newBlock], '');
        } else {
          // TipTap Doc Mode
          editor.commands.insertContent([
            {
              type: 'customBlock',
              attrs: { blockData: newBlock }
            },
            {
              type: 'paragraph'
            }
          ]);
        }
      });
    },
    updateBlock: (id: string, data: any) => {
      if (Array.isArray(content)) {
        const newBlocks = content.map(b =>
          b.id === id ? { ...b, data: { ...b.data, ...data } } : b
        );
        onChange(newBlocks, '');
      } else {
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
      }
    },
    removeBlock: (id: string) => {
      if (Array.isArray(content)) {
        const newBlocks = content.filter(b => b.id !== id);
        onChange(newBlocks, '');
      } else {
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'customBlock' && node.attrs.blockData?.id === id) {
            editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            return false;
          }
          return true;
        });
      }
    },
    undo: () => {
      editor.commands.undo();
    },
    redo: () => {
      editor.commands.redo();
    },
    setContent: (newContent: any) => {
      if (editor) {
        // Converte Array legacy para TipTap JSON se necessário
        let formatted = newContent;
        if (Array.isArray(newContent)) {
          formatted = {
            type: 'doc',
            content: newContent.map(block => ({
              type: 'customBlock',
              attrs: { blockData: block }
            }))
          };
        }
        editor.commands.setContent(formatted, false);
      }
    }
  }), [editor]);

  if (!editor) {
    return null;
  }

  const insertBlockAtEnd = (blockType: BlockType, layoutWidth: '1/3' | '1/2' | '1/1' = '1/1') => {
    import('../../components/Builder').then(({ createBlock }) => {
      const newBlock = createBlock(blockType as any);
      if (blockType === 'spacer') {
        newBlock.data = {
          ...newBlock.data,
          layoutWidth,
        };
      }

      if (Array.isArray(content)) {
        onChange([...content, newBlock], '');
      } else {
        const blockNode = editor.state.schema.nodes.customBlock.create({
          blockData: newBlock,
          layoutWidth,
        });
        const paragraphNode = editor.state.schema.nodes.paragraph.create();
        const endPos = editor.state.doc.content.size;
        const transaction = editor.state.tr.insert(endPos, [blockNode, paragraphNode]);
        editor.view.dispatch(transaction);
      }

      setIsEndPickerOpen(false);
    });
  };

  return (
    <div className={`unified-editor-container bg-transparent w-full mx-auto relative flex flex-col ${!readOnly ? 'min-h-screen' : ''} ${readOnly ? 'is-readonly' : ''}`}>
      <style>{`
        /* Modo Foco (Fade) - APENAS EM EDIÇÃO */
        .unified-editor-container:not(.is-readonly) .ProseMirror-focused > * {
          opacity: 0.4;
          transition: opacity 0.4s ease-in-out;
        }
        .unified-editor-container:not(.is-readonly) .ProseMirror-focused > .has-focus,
        .unified-editor-container:not(.is-readonly) .ProseMirror-focused > .custom-block-outer.has-focus * {
          opacity: 1 !important;
        }
        .unified-editor-container:not(.is-readonly) .ProseMirror > *:hover {
          opacity: 1 !important;
        }

        /* ===== LAYOUT GRID (Revista/Notion) ===== */
        .ProseMirror {
          display: flex !important;
          flex-wrap: wrap !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          align-content: flex-start !important;
          justify-content: center !important;
          gap: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          padding-bottom: 200px !important;
          min-height: 500px;
        }

        .ProseMirror * {
          box-sizing: border-box !important;
        }

        /* ===== BLOCOS CUSTOMIZADOS — flex items ===== */
        .ProseMirror > div[data-type="custom-block"],
        .ProseMirror > .node-customBlock {
          margin-bottom: 1rem;
          transition: transform 0.2s ease, opacity 0.2s ease;
          display: flex !important;
          flex-direction: column !important;
          min-width: 0;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* ===== LARGURAS POR ATRIBUTO layoutwidth ===== */
        .ProseMirror > [data-type="custom-block"][layoutwidth="1/1"],
        .ProseMirror > .node-customBlock[layoutwidth="1/1"] {
          flex: 0 0 100% !important; width: 100% !important; max-width: 100% !important;
        }
        .ProseMirror > [data-type="custom-block"][layoutwidth="1/2"],
        .ProseMirror > .node-customBlock[layoutwidth="1/2"] {
          flex: 0 0 50% !important; width: 50% !important; max-width: 50% !important;
        }
        .ProseMirror > [data-type="custom-block"][layoutwidth="1/3"],
        .ProseMirror > .node-customBlock[layoutwidth="1/3"] {
          flex: 0 0 33.3333% !important; width: 33.3333% !important; max-width: 33.3333% !important;
        }
        .ProseMirror > [data-type="custom-block"][layoutwidth="2/3"],
        .ProseMirror > .node-customBlock[layoutwidth="2/3"] {
          flex: 0 0 66.6666% !important; width: 66.6666% !important; max-width: 66.6666% !important;
        }

        /* ===== ELEMENTOS NÃO-BLOCO (parágrafos do TipTap) ===== */
        .ProseMirror > *:not([data-type="custom-block"]):not(.node-customBlock) {
          width: 100% !important;
          flex: 0 0 100% !important;
          max-width: 100% !important;
          margin-bottom: 1rem;
        }

        /* ===== OCULTAR LIXO DO TIPTAP (p vazios, br soltos) ===== */
        .ProseMirror > p:empty,
        .ProseMirror > p:has(> br:only-child):not(.has-focus) {
          display: none !important;
          height: 0 !important;
          width: 0 !important;
          flex: 0 0 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .ProseMirror > br {
          display: none !important;
        }
      `}</style>

      {/* {!readOnly && editor && <EditorTopBar editor={editor} />} */}
      {!readOnly && editor && <EditorBubbleMenu editor={editor} />}
      {!readOnly && editor && <EditorFloatingMenu editor={editor} />}

      <div className={`mx-auto relative w-full ${!readOnly ? 'pt-8 pb-32 px-2 sm:px-4' : ''}`}>
        {Array.isArray(content) ? (
          <BlockListEditor
            blocks={content}
            onChange={(newBlocks) => onChange(newBlocks, '')}
            onBlockSelect={onBlockSelect}
            isEditing={!readOnly}
          />
        ) : (
          <div className="w-full max-w-none mx-auto">
            <div className={`w-full shadow-[0_0_50px_rgba(0,0,0,0.05)] bg-white/30 dark:bg-bible-ink/10 backdrop-blur-sm ring-1 ring-bible-gold/10 rounded-[3rem] ${!readOnly ? 'py-12 px-8 min-h-[600px]' : 'py-8 px-4'}`}>
              <EditorContent editor={editor} />
            </div>
            {!readOnly && (
              <div className="relative mt-6 flex justify-center">
                <button
                  type="button"
                  data-testid="editor-add-section-button"
                  onClick={() => setIsEndPickerOpen((current) => !current)}
                  className="group inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-bible-gold/30 bg-white/90 px-5 py-3 text-sm font-bold text-bible-gold shadow-lg transition hover:border-bible-gold hover:bg-bible-gold hover:text-white"
                >
                  <Plus size={18} className="transition-transform group-hover:rotate-90" />
                  Adicionar seção
                </button>

                {isEndPickerOpen && (
                  <div
                    data-testid="editor-add-section-picker"
                    className="absolute bottom-[calc(100%+12px)] z-20 w-full max-w-xl rounded-[28px] border border-bible-gold/20 bg-white/98 p-4 shadow-2xl backdrop-blur"
                  >
                    <BlockPickerMenu
                      title="Escolha um bloco"
                      description="Adicione uma nova seção ao fim do conteúdo."
                      testId="editor-add-section-picker-menu"
                      onSelect={(type, width) => insertBlockAtEnd(type, width)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

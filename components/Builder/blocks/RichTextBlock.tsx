"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus,
  Undo, Redo,
  Link, Unlink,
  BookOpen, Heart, Zap, Hand, LayoutTemplate, ChevronDown, ChevronRight, Paintbrush,
} from 'lucide-react';

interface RichTextBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
  editor?: any;
  layoutWidth?: string;
}

// ─── Default Template ─────────────────────────────────────────────────────
const DEFAULT_CONTENT = `
<h1 style="text-align:center;font-family:'Playfair Display',Georgia,serif;color:#b45309;font-size:2.25rem;font-weight:800;margin:0 0 6px 0;line-height:1.2">A Revelação Plena</h1>
<p style="text-align:center;color:#a8a29e;font-size:0.875rem;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 20px 0">Estudo Bíblico Pastoral</p>
<hr style="border:none;border-top:2px solid #fde68a;width:60%;margin:0 auto 24px auto">
<h2 style="color:#92400e;font-size:1.25rem;font-weight:700;margin:0 0 10px 0;border-left:4px solid #c5a059;padding-left:12px">1. O Despertar</h2>
<p style="margin:0 0 14px 0">Apresente o tema com autoridade. Situe o leitor na jornada que ele está prestes a trilhar e ancore a mensagem na urgência espiritual do momento.</p>
<blockquote style="border-left:4px solid #c5a059;background:rgba(197,160,89,0.08);padding:14px 20px;margin:16px 0;border-radius:0 10px 10px 0;font-style:italic;color:#57534e">"A tua palavra é lâmpada para os meus pés e luz para o meu caminho." <cite style="display:block;margin-top:6px;font-size:0.85em;color:#c5a059;font-style:normal">— Salmos 119:105</cite></blockquote>
<h2 style="color:#92400e;font-size:1.25rem;font-weight:700;margin:20px 0 10px 0;border-left:4px solid #c5a059;padding-left:12px">2. As Raízes da Verdade</h2>
<p style="margin:0 0 14px 0">Explore o "porquê" por trás dos versículos. Traga à luz os significados ocultos pelo tempo e as conexões entre o Antigo e o Novo Testamento.</p>
<h2 style="color:#92400e;font-size:1.25rem;font-weight:700;margin:20px 0 10px 0;border-left:4px solid #c5a059;padding-left:12px">3. O Caminho Prático</h2>
<p style="margin:0 0 14px 0">Como essa verdade altera sua rotina? Seja incisivo, prático e pastoral ao traduzir o céu para a terra.</p>
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:16px 0"><h3 style="color:#d97706;margin:0 0 8px 0;font-size:1rem">⚡ Passo Prático</h3><p style="margin:0;color:#374151;font-size:0.9375rem">Como posso aplicar esta verdade bíblica na minha rotina hoje?</p></div>
<h2 style="color:#7c3aed;font-size:1.25rem;font-weight:700;margin:20px 0 10px 0;text-align:center">🕊️ Oração de Encerramento</h2>
<p style="text-align:center;font-style:italic;color:#57534e;margin:0">"Pai, que esta Palavra transforme nosso coração e nos capacite a vivê-la. Em nome de Jesus, Amém."</p>
`.trim();

// ─── Toolbar ──────────────────────────────────────────────────────────────
interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onExec: (cmd: string, val?: string) => void;
  onInsertHtml: (html: string) => void;
}

const Divider = () => <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 flex-shrink-0" />;

const FullToolbar: React.FC<ToolbarProps> = ({ onExec, onInsertHtml }) => {
  const [showBlocks, setShowBlocks] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const blocksRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (blocksRef.current && !blocksRef.current.contains(e.target as Node)) setShowBlocks(false);
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColor(false);
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) setShowHeadingMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const B = ({ title, icon, cmd, val, active }: { title: string; icon: React.ReactNode; cmd: string; val?: string; active?: boolean }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onExec(cmd, val); }}
      className={`p-1.5 rounded-md transition-all flex-shrink-0 ${
        active
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900'
      }`}
    >
      {icon}
    </button>
  );

  const TEXT_COLORS = ['#1c1917','#b45309','#7c3aed','#0369a1','#15803d','#b91c1c','#374151','#c5a059'];
  const BG_COLORS   = ['transparent','#fffbeb','#eff6ff','#f0fdf4','#fdf4ff','#fff1f2','#f8fafc','rgba(197,160,89,0.12)'];

  const THEMED_BLOCKS = [
    {
      label: 'Abertura / Gancho', icon: <Heart size={15} />, color: 'text-red-500',
      html: `<div style="background:#fff5f5;border-left:4px solid #ef4444;border-radius:12px;padding:18px 22px;margin:16px 0"><h3 style="color:#dc2626;margin:0 0 8px 0;font-size:1rem">Abertura do Coração</h3><p style="margin:0;color:#374151">Insira aqui uma introdução envolvente...</p></div><p><br></p>`
    },
    {
      label: 'Destaque Bíblico', icon: <BookOpen size={15} />, color: 'text-blue-500',
      html: `<blockquote style="border-left:4px solid #c5a059;padding:18px 22px;margin:20px 0;border-radius:0 12px 12px 0;background:#fffbf0;font-style:italic;font-size:1.1em">"Insira o versículo aqui..." <cite style="display:block;margin-top:6px;font-size:0.8em;color:#c5a059;font-style:normal">— Referência</cite></blockquote><p><br></p>`
    },
    {
      label: 'Passo Prático', icon: <Zap size={15} />, color: 'text-amber-500',
      html: `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 22px;margin:16px 0"><h3 style="color:#d97706;margin:0 0 8px 0;font-size:1rem">⚡ Passo Prático</h3><p style="margin:0;color:#374151">Como posso aplicar esta verdade hoje?</p></div><p><br></p>`
    },
    {
      label: 'Contexto Histórico', icon: <LayoutTemplate size={15} />, color: 'text-slate-500',
      html: `<div style="background:#f8fafc;border-radius:12px;padding:18px 22px;margin:16px 0;border:1px solid #e2e8f0"><h3 style="color:#475569;margin:0 0 8px 0;font-size:1rem">🏛️ Contexto e Mergulho</h3><p style="margin:0 0 6px 0;color:#374151"><strong>Cenário:</strong> Quem escreveu, para quem e por quê</p><p style="margin:0;color:#374151"><strong>Significado:</strong> Contexto cultural e teológico</p></div><p><br></p>`
    },
    {
      label: 'Perguntas de Reflexão', icon: <ChevronRight size={15} />, color: 'text-emerald-500',
      html: `<div style="border:2px dashed #d1d5db;border-radius:12px;padding:18px 22px;margin:16px 0"><h3 style="text-align:center;color:#475569;margin:0 0 14px 0;font-size:1rem">🤔 Perguntas de Reflexão</h3><ol style="margin:0;padding-left:20px;color:#374151"><li style="margin-bottom:6px">O que este texto revela sobre o caráter de Deus?</li><li style="margin-bottom:6px">Existe alguma promessa para crer ou comando para obedecer?</li><li>Como minha vida seria diferente se eu vivesse este versículo plenamente?</li></ol></div><p><br></p>`
    },
    {
      label: 'Oração de Fé', icon: <Hand size={15} />, color: 'text-purple-500',
      html: `<div style="background:linear-gradient(135deg,#fdf4ff,#faf5ff);border:1px solid #e9d5ff;border-radius:16px;padding:28px;margin:20px 0;text-align:center"><h3 style="color:#7c3aed;margin:0 0 10px 0;font-size:1rem">🕊️ Oração</h3><p style="font-style:italic;color:#555;margin:0">"Pai, guia este estudo pelo teu Espírito. Em nome de Jesus, Amém."</p></div><p><br></p>`
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Heading dropdown */}
      <div className="relative flex-shrink-0" ref={headingRef}>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowHeadingMenu(v => !v); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[60px]"
        >
          <span>Texto</span>
          <ChevronDown size={12} className={`transition-transform ${showHeadingMenu ? 'rotate-180' : ''}`} />
        </button>
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            {[
              { label: 'Parágrafo', cmd: 'formatBlock', val: 'P', className: 'text-sm' },
              { label: 'Título H1', cmd: 'formatBlock', val: 'H1', className: 'text-xl font-bold' },
              { label: 'Subtítulo H2', cmd: 'formatBlock', val: 'H2', className: 'text-lg font-semibold' },
              { label: 'Seção H3', cmd: 'formatBlock', val: 'H3', className: 'text-base font-semibold' },
              { label: 'Citação', cmd: 'formatBlock', val: 'BLOCKQUOTE', className: 'text-sm italic border-l-2 border-amber-400 pl-2' },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onExec(item.cmd, item.val);
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors ${item.className} text-gray-800 dark:text-gray-100`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Formatting */}
      <B title="Negrito (Ctrl+B)" icon={<Bold size={15} />} cmd="bold" />
      <B title="Itálico (Ctrl+I)" icon={<Italic size={15} />} cmd="italic" />
      <B title="Sublinhado (Ctrl+U)" icon={<Underline size={15} />} cmd="underline" />
      <B title="Tachado" icon={<Strikethrough size={15} />} cmd="strikeThrough" />

      <Divider />

      {/* Alignment */}
      <B title="Alinhar à Esquerda" icon={<AlignLeft size={15} />} cmd="justifyLeft" />
      <B title="Centralizar" icon={<AlignCenter size={15} />} cmd="justifyCenter" />
      <B title="Alinhar à Direita" icon={<AlignRight size={15} />} cmd="justifyRight" />
      <B title="Justificar" icon={<AlignJustify size={15} />} cmd="justifyFull" />

      <Divider />

      {/* Lists */}
      <B title="Lista com Marcadores" icon={<List size={15} />} cmd="insertUnorderedList" />
      <B title="Lista Numerada" icon={<ListOrdered size={15} />} cmd="insertOrderedList" />
      <B title="Separador" icon={<Minus size={15} />} cmd="insertHorizontalRule" />

      <Divider />

      {/* Link */}
      <button
        type="button"
        title="Inserir Link"
        onMouseDown={(e) => {
          e.preventDefault();
          const url = prompt('URL do link:');
          if (url) onExec('createLink', url);
        }}
        className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
      >
        <Link size={15} />
      </button>
      <B title="Remover Link" icon={<Unlink size={15} />} cmd="unlink" />

      <Divider />

      {/* Text color */}
      <div className="relative flex-shrink-0" ref={colorRef}>
        <button
          type="button"
          title="Cor do Texto"
          onMouseDown={(e) => { e.preventDefault(); setShowColor(v => !v); }}
          className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Paintbrush size={15} />
        </button>
        {showColor && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-150" style={{ width: 180 }}>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Cor do texto</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onExec('foreColor', c); setShowColor(false); }}
                  className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Fundo do texto</p>
            <div className="flex flex-wrap gap-1.5">
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onExec('hiliteColor', c === 'transparent' ? 'transparent' : c); setShowColor(false); }}
                  className={`w-6 h-6 rounded-full border-2 border-gray-200 shadow hover:scale-110 transition-transform ${c === 'transparent' ? 'bg-gradient-to-br from-gray-50 to-gray-200' : ''}`}
                  style={{ background: c !== 'transparent' ? c : undefined }}
                  title={c === 'transparent' ? 'Sem fundo' : c}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Themed blocks */}
      <div className="relative flex-shrink-0" ref={blocksRef}>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowBlocks(v => !v); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-colors flex-shrink-0 ${
            showBlocks ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
        >
          <LayoutTemplate size={14} />
          <span className="hidden md:inline">Blocos</span>
          <ChevronDown size={11} className={`transition-transform ${showBlocks ? 'rotate-180' : ''}`} />
        </button>

        {showBlocks && (
          <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            {THEMED_BLOCKS.map(item => (
              <button
                key={item.label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onInsertHtml(item.html); setShowBlocks(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-left transition-colors"
              >
                <span className={`flex-shrink-0 ${item.color}`}>{item.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-2" />

      {/* Undo / Redo */}
      <B title="Desfazer (Ctrl+Z)" icon={<Undo size={15} />} cmd="undo" />
      <B title="Refazer (Ctrl+Y)" icon={<Redo size={15} />} cmd="redo" />
    </div>
  );
};

// ─── Main Block ────────────────────────────────────────────────────────────
export const RichTextBlock: React.FC<RichTextBlockProps> = ({ data, onUpdate, isEditing, layoutWidth = '1/1' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const content = data.content || DEFAULT_CONTENT;

  // Responsive padding based on column width
  const contentPadding =
    layoutWidth === '1/3' ? 'px-4 py-5' :
    layoutWidth === '1/2' ? 'px-6 py-6' :
    'px-8 py-8';

  // Initialize DOM once on mount
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = content;
      isInitialized.current = true;
    }
  }, []);

  // Sync external content changes (e.g. AI generation) only when not focused
  useEffect(() => {
    if (editorRef.current && isInitialized.current) {
      if (document.activeElement !== editorRef.current && editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onUpdate?.({ ...data, content: editorRef.current.innerHTML });
    }
  }, [data, onUpdate]);

  const execFormat = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? undefined);
    if (editorRef.current) {
      onUpdate?.({ ...data, content: editorRef.current.innerHTML });
    }
  }, [data, onUpdate]);

  const insertHtml = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      onUpdate?.({ ...data, content: editorRef.current.innerHTML });
    }
  }, [data, onUpdate]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1c1917] rounded-2xl overflow-hidden border border-gray-200/70 dark:border-white/5 shadow-sm">
      <style>{`
        .rtb-editor {
          font-family: 'Lora', 'Georgia', serif;
          font-size: 1.0625rem;
          line-height: 1.8;
          color: #1c1917;
          min-height: 360px;
          caret-color: #c5a059;
        }
        .dark .rtb-editor { color: #e7e5e4; background: #1c1917; }
        .rtb-editor:focus { outline: none; }
        .rtb-editor > *:first-child { margin-top: 0; }
        .rtb-editor > *:last-child { margin-bottom: 0; }
        .rtb-editor h1 {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: clamp(1.375rem, 4vw, 2rem); font-weight: 800; line-height: 1.25;
          color: #b45309; margin: 0.1em 0 0.5em 0;
        }
        .dark .rtb-editor h1 { color: #fbbf24; }
        .rtb-editor h2 {
          font-size: 1.35rem; font-weight: 700; line-height: 1.3;
          color: #92400e; margin: 1.25em 0 0.45em 0;
          border-left: 4px solid #c5a059; padding-left: 12px;
        }
        .dark .rtb-editor h2 { color: #fcd34d; border-color: #92400e; }
        .rtb-editor h3 {
          font-size: 1.1rem; font-weight: 700; line-height: 1.4;
          color: #57534e; margin: 1em 0 0.4em 0;
        }
        .dark .rtb-editor h3 { color: #a8a29e; }
        .rtb-editor p { margin: 0 0 0.85em 0; }
        .rtb-editor p:empty { display: none; }
        .rtb-editor blockquote {
          border-left: 4px solid #c5a059;
          background: rgba(197,160,89,0.07);
          padding: 12px 18px;
          margin: 14px 0;
          border-radius: 0 10px 10px 0;
          font-style: italic;
          color: #57534e;
        }
        .dark .rtb-editor blockquote { color: #a8a29e; background: rgba(197,160,89,0.1); }
        .rtb-editor ul { list-style: disc; padding-left: 1.5em; margin: 0 0 0.85em 0; }
        .rtb-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 0.85em 0; }
        .rtb-editor li { margin-bottom: 0.3em; }
        .rtb-editor strong, .rtb-editor b { font-weight: 700; }
        .rtb-editor em, .rtb-editor i { font-style: italic; }
        .rtb-editor u { text-decoration: underline; }
        .rtb-editor s { text-decoration: line-through; }
        .rtb-editor a { color: #c5a059; text-decoration: underline; }
        .rtb-editor hr { border: none; border-top: 2px solid #fde68a; margin: 18px 0; }
        .rtb-editor img { max-width: 100%; border-radius: 10px; margin: 14px 0; display: block; }
        .rtb-editor cite { font-style: normal; }
      `}</style>

      {isEditing && (
        <FullToolbar
          editorRef={editorRef}
          onExec={execFormat}
          onInsertHtml={insertHtml}
        />
      )}

      <div
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Comece a escrever..."
        className={`rtb-editor flex-1 ${contentPadding} overflow-y-auto`}
        style={{ outline: 'none' }}
      />
    </div>
  );
};

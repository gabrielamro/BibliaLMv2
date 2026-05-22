"use client";

import React from 'react';
import { Download, ImageIcon, Palette, Send, Sparkles, Type } from 'lucide-react';

import {
  DESKTOP_DOCK_POSITION_CLASS,
  EDITOR_LAYER_Z_INDEX,
  MOBILE_DOCK_POSITION_CLASS,
} from '../../app/criar-arte-sacra/editorLayout';
import type { EditorControlTab } from './types';

interface SacredArtDockProps {
  activeControlTab: EditorControlTab;
  setActiveControlTab: React.Dispatch<React.SetStateAction<EditorControlTab>>;
  onDownload: () => void;
  onPostToFeed?: () => void;
  canPostToFeed?: boolean;
  isStatic?: boolean;
}

const DOCK_ITEMS = [
  { id: 'templates', icon: <ImageIcon size={18} />, label: 'Substituir' },
  { id: 'ai', icon: <Sparkles size={18} />, label: 'IA' },
  { id: 'text', icon: <Type size={18} />, label: 'Texto' },
  { id: 'style', icon: <Palette size={18} />, label: 'Estilo' },
] as const;

export default function SacredArtDock({
  activeControlTab,
  setActiveControlTab,
  onDownload,
  onPostToFeed,
  canPostToFeed = false,
  isStatic = false,
}: SacredArtDockProps) {
  return (
    <div
      className={isStatic ? "relative w-[132px]" : `fixed bottom-[72px] md:bottom-8 w-auto max-w-[95%] ${MOBILE_DOCK_POSITION_CLASS} ${DESKTOP_DOCK_POSITION_CLASS}`}
      style={{ zIndex: EDITOR_LAYER_Z_INDEX.dock }}
    >
      <div className={`bg-white/85 dark:bg-black/70 backdrop-blur-2xl p-2 rounded-[24px] border border-gray-200/60 dark:border-white/10 shadow-2xl flex md:flex-col items-stretch gap-1.5 overflow-x-auto no-scrollbar ${isStatic ? 'w-[132px]' : ''}`}>
        {DOCK_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveControlTab((current) => (current === item.id ? 'templates' : item.id))}
            className={`flex items-center justify-center rounded-2xl transition-all ${isStatic ? 'h-11 w-full gap-2 px-3 py-2' : 'flex-col gap-1 px-4 py-2'} ${activeControlTab === item.id ? 'bg-bible-gold text-black font-black shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}`}
            aria-label={item.label}
          >
            {item.icon}
            <span className={`${isStatic ? 'text-[10px] tracking-wide' : 'text-[8px] tracking-tight'} uppercase font-black leading-none`}>{item.label}</span>
          </button>
        ))}
        <div className={`${isStatic ? 'h-px w-full my-1' : 'h-8 w-px md:h-px md:w-8 mx-1 md:my-1'} bg-gray-200 dark:bg-white/10`} />
        <button
          onClick={onDownload}
          className={`bg-white dark:bg-white/10 text-bible-gold hover:scale-[1.03] transition-transform shadow-sm flex items-center justify-center ${isStatic ? 'h-11 w-full rounded-2xl gap-2 px-3' : 'p-3 rounded-full'}`}
          title="Baixar arte"
          aria-label="Baixar arte"
        >
          <Download size={18} />
          {isStatic && <span className="text-[10px] font-black uppercase tracking-wide text-gray-600 dark:text-gray-200">Baixar</span>}
        </button>
        {onPostToFeed && (
          <button
            onClick={onPostToFeed}
            disabled={!canPostToFeed}
            className={`bg-bible-gold rounded-2xl text-black hover:scale-[1.03] active:scale-95 transition-transform shadow-sm disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 ${isStatic ? 'h-11 w-full px-3 py-2 min-w-0' : 'px-4 py-3 min-w-[150px] md:min-w-[128px]'}`}
            title="Postar no Reino"
            aria-label="Postar no Reino"
          >
            <Send size={18} />
            <span className={`${isStatic ? 'text-[10px] tracking-wide' : 'text-[10px] tracking-widest'} font-black uppercase whitespace-nowrap`}>{isStatic ? 'Postar' : 'Postar no Reino'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

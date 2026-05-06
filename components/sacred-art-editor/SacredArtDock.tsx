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
      className={isStatic ? "relative w-auto" : `fixed bottom-[72px] md:bottom-8 w-auto max-w-[95%] ${MOBILE_DOCK_POSITION_CLASS} ${DESKTOP_DOCK_POSITION_CLASS}`}
      style={{ zIndex: EDITOR_LAYER_Z_INDEX.dock }}
    >
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-2xl px-2 py-2 rounded-[32px] border border-gray-200/50 dark:border-white/10 shadow-2xl flex md:flex-col items-center gap-1 overflow-x-auto no-scrollbar">
        {DOCK_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveControlTab((current) => (current === item.id ? null : item.id))}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${activeControlTab === item.id ? 'bg-bible-gold text-black font-black' : 'text-gray-400 hover:text-white'}`}
          >
            {item.icon}
            <span className="text-[7px] uppercase tracking-tighter font-black">{item.label}</span>
          </button>
        ))}
        <div className="h-8 w-px md:h-px md:w-8 bg-gray-200 dark:bg-white/10 mx-1 md:my-1" />
        <button
          onClick={onDownload}
          className="bg-white dark:bg-white/10 p-3 rounded-full text-bible-gold hover:scale-110 transition-transform shadow-sm"
          title="Baixar arte"
        >
          <Download size={18} />
        </button>
        {onPostToFeed && (
          <button
            onClick={onPostToFeed}
            disabled={!canPostToFeed}
            className="bg-bible-gold px-4 py-3 rounded-full text-black hover:scale-[1.03] active:scale-95 transition-transform shadow-sm disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 min-w-[150px] md:min-w-[128px]"
            title="Postar no Reino"
          >
            <Send size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Postar no Reino</span>
          </button>
        )}
      </div>
    </div>
  );
}

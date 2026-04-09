"use client";

import React from 'react';
import { Download, ImageIcon, Palette, Sparkles, Type } from 'lucide-react';

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
}: SacredArtDockProps) {
  return (
    <div
      className={`fixed bottom-[72px] md:bottom-8 w-auto max-w-[95%] ${MOBILE_DOCK_POSITION_CLASS} ${DESKTOP_DOCK_POSITION_CLASS}`}
      style={{ zIndex: EDITOR_LAYER_Z_INDEX.dock }}
    >
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-2xl px-2 py-2 rounded-full border border-gray-200/50 dark:border-white/10 shadow-2xl flex items-center gap-1 overflow-x-auto no-scrollbar">
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
        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
        <button
          onClick={onDownload}
          className="bg-white dark:bg-white/10 p-3 rounded-full text-bible-gold hover:scale-110 transition-transform shadow-sm"
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  );
}

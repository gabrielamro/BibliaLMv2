'use client';

import React from 'react';
import {
  BookOpen,
  Command,
  LayoutGrid,
  LayoutTemplate,
  ListTree,
  Sparkles,
} from 'lucide-react';

export type StudioPanel = 'structure' | 'insert' | 'models' | 'bible' | 'ai';

interface StudioToolRailProps {
  active: StudioPanel;
  onChange: (panel: StudioPanel) => void;
}

const items = [
  { id: 'structure' as const, label: 'Estrutura', icon: ListTree },
  { id: 'insert' as const, label: 'Inserir', icon: LayoutGrid },
  { id: 'models' as const, label: 'Modelos', icon: LayoutTemplate },
  { id: 'bible' as const, label: 'Bíblia', icon: BookOpen },
  { id: 'ai' as const, label: 'IA', icon: Sparkles },
];

export const StudioToolRail: React.FC<StudioToolRailProps> = ({ active, onChange }) => (
  <nav
    aria-label="Ferramentas do Estúdio"
    className="hidden w-[76px] flex-shrink-0 flex-col items-center border-r border-[#e8e4dc] bg-[#fffefa] py-3 lg:flex dark:border-gray-800 dark:bg-gray-950"
  >
    <div className="flex flex-1 flex-col gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.id)}
            className={`flex min-h-[62px] w-[62px] flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-bold transition-colors ${
              selected
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                : 'text-gray-500 hover:bg-gray-100 hover:text-bible-ink dark:hover:bg-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon size={19} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
    <button
      type="button"
      className="flex min-h-12 w-[62px] flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
      aria-label="Ver atalhos do teclado"
      title="Atalhos do teclado"
    >
      <Command size={18} aria-hidden="true" />
      Atalhos
    </button>
  </nav>
);

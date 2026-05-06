"use client";

import React from 'react';
import { BookOpen, GraduationCap, LayoutGrid, Send, Users } from 'lucide-react';
import type { StudioTab } from './types';

const tabs: Array<{ id: StudioTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Visao geral', icon: LayoutGrid },
  { id: 'lessons', label: 'Aulas', icon: BookOpen },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'evaluation', label: 'Avaliacao', icon: GraduationCap },
  { id: 'publication', label: 'Publicacao', icon: Send },
];

interface PlanStudioTabsProps {
  activeTab: StudioTab;
  onChange: (tab: StudioTab) => void;
}

const PlanStudioTabs: React.FC<PlanStudioTabsProps> = ({ activeTab, onChange }) => (
  <div className="rounded-2xl border border-purple-100 bg-white p-2 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
    <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Secoes da sala">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-black transition-colors ${
              active
                ? 'bg-purple-700 text-white shadow-sm dark:bg-violet-500'
                : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-400 dark:hover:bg-purple-950/30 dark:hover:text-violet-200'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default PlanStudioTabs;

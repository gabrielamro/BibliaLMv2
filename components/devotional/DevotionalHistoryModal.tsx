"use client";

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  HeartHandshake,
  Pencil,
  Star,
  Target,
  X,
} from 'lucide-react';

export type JournalTab = 'devotionals' | 'notes' | 'prayers' | 'commitments' | 'favorites';

interface DevotionalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedNotes?: Array<{ id: string; date: string; title: string; note: string }>;
  savedPrayers?: Array<{ id: string; date: string; prayer: string; isAnswered?: boolean }>;
  savedCommitments?: Array<{ id: string; date: string; commitment: string; isDone?: boolean }>;
  favoriteVerses?: Array<{ id: string; verse: string; reference: string }>;
  onToggleAnsweredPrayer?: (id: string) => void;
}

export default function DevotionalHistoryModal({
  isOpen,
  onClose,
  savedNotes = [],
  savedPrayers = [],
  savedCommitments = [],
  favoriteVerses = [],
  onToggleAnsweredPrayer,
}: DevotionalHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<JournalTab>('notes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-[28px] border border-[#f0e4cf] bg-[#fffdf8] shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#eee4d5] p-6 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
              <BookOpen size={20} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
                Meu Diário Espiritual
              </h2>
              <p className="text-xs text-[#736353] dark:text-[#a89988]">
                Seu histórico pessoal de caminhada e registros com a Palavra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ebd9] text-[#4a3928] hover:bg-[#e8dcbf] dark:bg-[#2b2722] dark:text-[#ebdccb]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-[#eee4d5] px-6 dark:border-white/10">
          {[
            { id: 'notes', label: 'Anotações', icon: Pencil, count: savedNotes.length },
            { id: 'prayers', label: 'Orações', icon: HeartHandshake, count: savedPrayers.length },
            { id: 'commitments', label: 'Compromissos', icon: Target, count: savedCommitments.length },
            { id: 'favorites', label: 'Favoritos', icon: Star, count: favoriteVerses.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as JournalTab)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                  isActive
                    ? 'border-[#edad2c] text-[#edad2c]'
                    : 'border-transparent text-[#736353] hover:text-[#302316] dark:text-[#a89988] dark:hover:text-[#fff7eb]'
                }`}
              >
                <IconComponent size={15} />
                <span>{tab.label}</span>
                {tab.count > 0 ? (
                  <span className="rounded-full bg-[#edad2c]/20 px-2 py-0.5 text-[10px] font-black text-[#edad2c]">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'notes' ? (
            <div className="space-y-4">
              {savedNotes.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Nenhuma anotação registrada ainda.
                </div>
              ) : (
                savedNotes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#eee4d5] bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#272420]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#edad2c]">
                      <span>{item.title}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#4a3928] dark:text-[#ebdccb]">
                      {item.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'prayers' ? (
            <div className="space-y-4">
              {savedPrayers.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Nenhuma oração registrada ainda.
                </div>
              ) : (
                savedPrayers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-2xl border border-[#eee4d5] bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#272420]"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#edad2c]">
                        {item.date}
                      </span>
                      <p className="mt-1 font-serif text-xs italic text-[#302316] dark:text-[#fff7eb]">
                        “{item.prayer}”
                      </p>
                    </div>

                    {onToggleAnsweredPrayer ? (
                      <button
                        type="button"
                        onClick={() => onToggleAnsweredPrayer(item.id)}
                        className={`ml-3 flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition ${
                          item.isAnswered
                            ? 'bg-[#edad2c] text-white'
                            : 'border border-[#ded5c7] text-[#736353] hover:bg-[#edad2c]/10 dark:border-white/10'
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        <span>{item.isAnswered ? 'Respondida!' : 'Marcar respondida'}</span>
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'commitments' ? (
            <div className="space-y-3">
              {savedCommitments.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Nenhum compromisso registrado ainda.
                </div>
              ) : (
                savedCommitments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#eee4d5] bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#272420]"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        item.isDone ? 'bg-[#edad2c] text-white' : 'border border-gray-400 text-transparent'
                      }`}
                    >
                      <Check size={12} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#302316] dark:text-[#fff7eb]">
                        {item.commitment}
                      </p>
                      <span className="text-[10px] text-[#736353] dark:text-[#a89988]">
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'favorites' ? (
            <div className="space-y-4">
              {favoriteVerses.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Nenhum versículo favoritado ainda.
                </div>
              ) : (
                favoriteVerses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#eee4d5] bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#272420]"
                  >
                    <blockquote
                      className="font-serif text-xs italic text-[#302316] dark:text-[#fff7eb]"
                      style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                    >
                      “{item.verse}”
                    </blockquote>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-wider text-[#edad2c]">
                      {item.reference}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

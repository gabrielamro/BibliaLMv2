"use client";

import React, { useState } from 'react';
import { Bell, Clock, Moon, Sun, X } from 'lucide-react';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { time: string; days: string; mode: 'morning' | 'night'; enabled: boolean }) => void;
  initialTime?: string;
  initialEnabled?: boolean;
}

export default function ReminderSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialTime = '08:00',
  initialEnabled = true,
}: ReminderSettingsModalProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [time, setTime] = useState(initialTime);
  const [days, setDays] = useState('daily'); // 'daily' | 'weekdays' | 'weekends'
  const [mode, setMode] = useState<'morning' | 'night'>('morning');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[28px] border border-[#f0e4cf] bg-[#fffdf8] p-6 shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in zoom-in-95 duration-200">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-[#eee4d5] pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6b127]/15 text-[#f6b127]">
              <Bell size={20} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
                Lembrete do Pão Diário
              </h2>
              <p className="text-xs text-[#736353] dark:text-[#a89988]">
                Configure seu horário diário de devocional.
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

        {/* Formulário de Configuração */}
        <div className="mt-5 space-y-5">
          {/* Switch de Ativação */}
          <div className="flex items-center justify-between rounded-2xl border border-[#eee4d5] bg-white/80 p-4 dark:border-white/10 dark:bg-[#272420]">
            <div>
              <span className="block text-xs font-bold text-[#302316] dark:text-[#fff7eb]">
                Ativar lembretes no celular
              </span>
              <span className="text-[11px] text-[#736353] dark:text-[#a89988]">
                "Seu momento com a Palavra está preparado."
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`h-6 w-11 rounded-full p-1 transition ${
                enabled ? 'bg-[#f6b127]' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Seleção de Horário */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#f6b127]">
              Horário do lembrete
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['06:00', '07:00', '08:00', '12:00', '20:00', '21:00'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setTime(item);
                    if (item.startsWith('20') || item.startsWith('21')) setMode('night');
                    else setMode('morning');
                  }}
                  className={`flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition ${
                    time === item
                      ? 'border-[#f6b127] bg-[#f6b127]/15 text-[#302316] dark:text-[#fff7eb]'
                      : 'border-[#eee4d5] bg-white/80 text-[#736353] hover:border-[#f6b127]/50 dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]'
                  }`}
                >
                  <Clock size={13} className="text-[#f6b127]" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequência dos Dias */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#f6b127]">
              Frequência
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              {[
                { id: 'daily', label: 'Todos os dias' },
                { id: 'weekdays', label: 'Segunda a Sexta' },
                { id: 'weekends', label: 'Fins de semana' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDays(item.id)}
                  className={`rounded-xl border p-2.5 transition ${
                    days === item.id
                      ? 'border-[#f6b127] bg-[#f6b127]/15 text-[#302316] dark:text-[#fff7eb]'
                      : 'border-[#eee4d5] bg-white/80 text-[#736353] dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modo Manhã ou Noite */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#f6b127]">
              Experiência preferida
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('morning')}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  mode === 'morning'
                    ? 'border-[#f6b127] bg-[#f6b127]/15 text-[#302316] dark:text-[#fff7eb]'
                    : 'border-[#eee4d5] bg-white/80 text-[#736353] dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]'
                }`}
              >
                <Sun size={20} className="text-[#f6b127]" />
                <div>
                  <strong className="block text-xs">Modo Manhã</strong>
                  <small className="text-[10px] opacity-80">Preparação diária</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('night')}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  mode === 'night'
                    ? 'border-[#f6b127] bg-[#f6b127]/15 text-[#302316] dark:text-[#fff7eb]'
                    : 'border-[#eee4d5] bg-white/80 text-[#736353] dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]'
                }`}
              >
                <Moon size={20} className="text-purple-400" />
                <div>
                  <strong className="block text-xs">Modo Noite</strong>
                  <small className="text-[10px] opacity-80">Reflexão & Gratidão</small>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              onSave({ time, days, mode, enabled });
              onClose();
            }}
            className="inline-flex w-full min-h-11 items-center justify-center rounded-full bg-[#f6b127] text-xs font-black uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[#e09e1f]"
          >
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  );
}

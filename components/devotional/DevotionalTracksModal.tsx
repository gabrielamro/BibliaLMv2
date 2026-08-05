"use client";

import React from 'react';
import Link from 'next/link';
import { Compass, ExternalLink, Sparkles, X } from 'lucide-react';

export type DevotionalTrack = {
  id: string;
  title: string;
  subtitle: string;
  durationDays: number;
  description: string;
  category: string;
  authorType: 'pastor' | 'platform' | 'ai';
  authorName: string;
  coverColor: string;
};

export const DEVOTIONAL_TRACKS: DevotionalTrack[] = [
  {
    id: 'vencendo-ansiedade',
    title: 'Vencendo a Ansiedade',
    subtitle: 'A paz que excede o entendimento',
    durationDays: 7,
    description: 'Encontre descanso e confiança entregando suas preocupações a Deus.',
    category: 'Cura Emocional',
    authorType: 'pastor',
    authorName: 'Pr. Gabriel Amaro',
    coverColor: 'from-amber-600 to-yellow-500',
  },
  {
    id: 'edificando-lar',
    title: 'Edificando o Lar',
    subtitle: 'Princípios bíblicos para a família',
    durationDays: 14,
    description: 'Fortalecendo o amor, a paciência e a unidade em casa.',
    category: 'Família',
    authorType: 'pastor',
    authorName: 'Pastoral Culto+',
    coverColor: 'from-emerald-600 to-teal-500',
  },
  {
    id: 'cura-perdao',
    title: 'A Cura do Perdão',
    subtitle: 'Libertação de feridas do passado',
    durationDays: 10,
    description: 'Experimente a liberdade graciosa de perdoar assim como fomos perdoados.',
    category: 'Restauração',
    authorType: 'pastor',
    authorName: 'Cuidado Pastoral',
    coverColor: 'from-purple-600 to-indigo-500',
  },
  {
    id: 'caminhando-proposito',
    title: 'Caminhando em Propósito',
    subtitle: 'Descobrindo o chamado de Deus',
    durationDays: 21,
    description: 'Passos práticos e bíblicos para viver o plano de Deus para sua vida.',
    category: 'Propósito',
    authorType: 'platform',
    authorName: 'Equipe Culto+',
    coverColor: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'coracao-agradecido',
    title: 'Coração Agradecido',
    subtitle: 'A força da gratidão diária',
    durationDays: 5,
    description: 'Transforme seu olhar e sua rotina cultivando um espírito de louvor.',
    category: 'Espiritualidade',
    authorType: 'ai',
    authorName: 'Curadoria IA (Obreiro)',
    coverColor: 'from-amber-500 to-orange-500',
  },
];

interface DevotionalTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: DevotionalTrack) => void;
}

export default function DevotionalTracksModal({
  isOpen,
  onClose,
  onSelectTrack,
}: DevotionalTracksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col rounded-[28px] border border-[#f0e4cf] bg-[#fffdf8] shadow-2xl dark:border-white/10 dark:bg-[#1f1d1a] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#eee4d5] p-6 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
              <Compass size={20} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">
                Trilhas Temáticas de Estudo
              </h2>
              <p className="text-xs text-[#736353] dark:text-[#a89988]">
                Jornadas guiadas com leitura, reflexão e prática da Palavra.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trilhas"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#edad2c] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#d99c22]"
            >
              <span>Explorar no Módulo Trilhas</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ebd9] text-[#4a3928] hover:bg-[#e8dcbf] dark:bg-[#2b2722] dark:text-[#ebdccb]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {DEVOTIONAL_TRACKS.map((track) => (
              <div
                key={track.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#eee4d5] bg-white/90 p-5 shadow-sm transition hover:border-[#edad2c] dark:border-white/10 dark:bg-[#272420]"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="rounded-full bg-[#edad2c]/15 px-2.5 py-0.5 uppercase text-[#edad2c]">
                      {track.category}
                    </span>
                    <span className="text-gray-400">{track.durationDays} dias</span>
                  </div>

                  <h3 className="mt-2 font-serif text-base font-bold text-[#302316] dark:text-[#fff7eb]">
                    {track.title}
                  </h3>

                  <p className="text-xs font-medium text-[#edad2c]">{track.subtitle}</p>

                  <p className="mt-2 text-xs leading-relaxed text-[#736353] dark:text-[#a89988]">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#eee4d5] pt-3 text-[10px] text-gray-400 dark:border-white/10">
                  <span className="flex items-center gap-1 font-semibold text-gray-500 dark:text-gray-400">
                    <Sparkles size={11} className="text-[#edad2c]" /> {track.authorName}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTrack(track);
                      onClose();
                    }}
                    className="rounded-full bg-[#edad2c] px-3.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-[#d99c22]"
                  >
                    Iniciar Trilha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

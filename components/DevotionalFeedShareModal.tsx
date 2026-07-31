"use client";

import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Globe2, Loader2, LockKeyhole, Send, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { kingdomPublishingService } from '../services/kingdomPublishingService';
import { buildDevotionalShareContent } from '../utils/devotionalSharePost';
import DevotionalFeedCardContent from './DevotionalFeedCardContent';

type ShareDestination = 'global' | 'church' | 'cell';

interface DevotionalFeedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
  devotional: {
    id: string;
    title: string;
    verseText: string;
    verseReference: string;
    date: string;
  };
}

const audienceMeta = {
  global: { label: 'Reino', description: 'Visível no feed público', icon: Globe2 },
  church: { label: 'Minha igreja', description: 'Somente para a sua igreja', icon: Users },
  cell: { label: 'Meu grupo', description: 'Somente para o seu grupo', icon: Users },
} as const;

export default function DevotionalFeedShareModal({
  isOpen,
  onClose,
  onPublished,
  devotional,
}: DevotionalFeedShareModalProps) {
  const { currentUser, userProfile, openLogin, recordActivity, showNotification } = useAuth();
  const [message, setMessage] = useState('');
  const [destination, setDestination] = useState<ShareDestination>('global');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMessage('');
    setDestination('global');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const churchData = userProfile?.churchData;
  const audienceOptions: ShareDestination[] = [
    'global',
    ...(churchData?.churchId ? ['church' as const] : []),
    ...(churchData?.groupId ? ['cell' as const] : []),
  ];
  const AudienceIcon = audienceMeta[destination].icon;

  const handlePublish = async () => {
    if (!currentUser || !userProfile) {
      onClose();
      openLogin('/devocional');
      return;
    }

    setIsPublishing(true);
    try {
      const visibility = destination === 'church' ? 'church' : destination === 'cell' ? 'group' : 'public';
      const content = buildDevotionalShareContent({
        kind: 'devotional_share',
        devotionalId: devotional.id,
        devotionalTitle: devotional.title,
        verseText: devotional.verseText,
        verseReference: devotional.verseReference,
        devotionalUrl: '/devocional',
        devotionalDate: devotional.date,
        message,
      });

      await kingdomPublishingService.publish({
        publisher: {
          userId: currentUser.uid ?? currentUser.id,
          displayName: userProfile.displayName,
          username: userProfile.username,
          photoURL: userProfile.photoURL,
        },
        type: 'devotional',
        content,
        audience: {
          destination,
          visibility,
          churchId: destination === 'church' ? churchData?.churchId : undefined,
          cellId: destination === 'cell' ? churchData?.groupId : undefined,
        },
        sourceType: 'daily_devotional',
        sourceId: devotional.id,
        dedupeKey: `devotional:${devotional.id}`,
        metadata: {
          title: devotional.title,
          verseReference: devotional.verseReference,
          devotionalDate: devotional.date,
        },
      });

      try {
        await recordActivity('social_post', 'Compartilhou o Pão Diário no Reino', {
          sourceId: devotional.id,
          sourceType: 'devotional',
        });
      } catch (activityError) {
        console.warn('Pão Diário publicado, mas a atividade social não foi registrada:', activityError);
      }
      await onPublished();
      showNotification('Pão Diário publicado no feed.', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao publicar Pão Diário:', error);
      showNotification('Não foi possível publicar. Tente novamente.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center bg-[#031015]/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPublishing) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="devotional-share-title"
        className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-[#fdfbf7] shadow-2xl sm:rounded-[2rem] dark:bg-[#0f1112]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e8e2d9] px-5 py-4 sm:px-6 dark:border-white/10">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Publicação no Reino</p>
            <h2 id="devotional-share-title" className="mt-1 text-xl font-black text-[#0b2347] dark:text-white">Compartilhar o que edificou você</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Revise a prévia antes de publicar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            aria-label="Fechar publicação"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e1dbd2] bg-white text-gray-500 transition hover:text-gray-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_250px]">
            <div>
              <DevotionalFeedCardContent
                title={devotional.title}
                verseText={devotional.verseText}
                verseReference={devotional.verseReference}
                message={message}
                interactive={false}
              />
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0b2347] dark:text-gray-200">Sua mensagem pública</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 280))}
                  rows={5}
                  placeholder="O que você quer compartilhar desta Palavra? (opcional)"
                  className="mt-2 w-full resize-none rounded-2xl border border-[#ddd6cc] bg-white p-3 text-sm leading-relaxed text-[#213047] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <span className="mt-1 block text-right text-[10px] text-gray-400">{message.length}/280</span>
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0b2347] dark:text-gray-200">Quem pode ver?</span>
                <div className="relative mt-2">
                  <AudienceIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-300" size={17} />
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value as ShareDestination)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#ddd6cc] bg-white pl-10 pr-9 text-sm font-bold text-[#0b2347] outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#151919] dark:text-white"
                  >
                    {audienceOptions.map((option) => (
                      <option key={option} value={option}>{audienceMeta[option].label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <span className="mt-1.5 block text-[10px] text-gray-500 dark:text-gray-400">{audienceMeta[destination].description}</span>
              </label>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-400/15 dark:bg-violet-500/10">
                <div className="flex gap-2.5">
                  <LockKeyhole className="mt-0.5 shrink-0 text-violet-700 dark:text-violet-300" size={17} />
                  <p className="text-xs leading-relaxed text-violet-900 dark:text-violet-100">
                    Sua reflexão pessoal não será publicada. Apenas a mensagem acima fará parte do card.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#e8e2d9] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/10 dark:bg-[#111515]">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            <Check size={14} className="text-emerald-700" /> A publicação sempre depende da sua confirmação.
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-black uppercase tracking-[0.13em] text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isPublishing ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {isPublishing ? 'Publicando...' : 'Publicar no feed'}
          </button>
        </footer>
      </section>
    </div>
  );
}

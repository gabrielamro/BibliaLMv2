"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Globe, Loader2, Lock, Send, Share2, Users, X } from 'lucide-react';
import type { ContentPrivacyLevel, CustomPlan, UserProfile } from '../../types';
import { normalizePlanPrivacy, type PlanPrivacyInput } from '../../utils/planSharing';

type Props = {
  isOpen: boolean;
  plan: CustomPlan;
  shareUrl: string;
  userProfile?: UserProfile | null;
  isSaving?: boolean;
  isSharingFeed?: boolean;
  onClose: () => void;
  onSave: (settings: ReturnType<typeof normalizePlanPrivacy> & { churchId?: string }) => Promise<void> | void;
  onShareFeed: (description: string) => Promise<void> | void;
  onCopy: (value: string) => Promise<void> | void;
};

const splitIds = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getInitialVisibility = (plan: CustomPlan): ContentPrivacyLevel => {
  const visibility = plan.privacyLevel || plan.privacyType;
  if (visibility === 'public' || visibility === 'church' || visibility === 'group' || visibility === 'church_groups' || visibility === 'invite_only') {
    return visibility;
  }
  return 'invite_only';
};

const PlanShareModal: React.FC<Props> = ({
  isOpen,
  plan,
  shareUrl,
  userProfile,
  isSaving = false,
  isSharingFeed = false,
  onClose,
  onSave,
  onShareFeed,
  onCopy,
}) => {
  const [visibility, setVisibility] = useState<ContentPrivacyLevel>(() => getInitialVisibility(plan));
  const [allowPdfDownload, setAllowPdfDownload] = useState(Boolean(plan.allowPdfDownload));
  const [userIdsText, setUserIdsText] = useState((plan.allowedUserIds || []).join(', '));
  const [groupIdsText, setGroupIdsText] = useState((plan.allowedGroupIds || (plan.groupId ? [plan.groupId] : [])).join(', '));
  const [feedDescription, setFeedDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedUserIds = useMemo(() => splitIds(userIdsText), [userIdsText]);
  const selectedGroupIds = useMemo(() => splitIds(groupIdsText), [groupIdsText]);
  const churchId = userProfile?.churchData?.churchId || plan.churchId;

  useEffect(() => {
    if (!isOpen) return;
    setVisibility(getInitialVisibility(plan));
    setAllowPdfDownload(Boolean(plan.allowPdfDownload));
    setUserIdsText((plan.allowedUserIds || []).join(', '));
    setGroupIdsText((plan.allowedGroupIds || (plan.groupId ? [plan.groupId] : [])).join(', '));
    setFeedDescription('');
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const requiresUsers = visibility === 'invite_only' || visibility === 'private';
  const requiresGroups = visibility === 'group' || visibility === 'church_groups';
  const requiresChurch = visibility === 'church';
  const isInvalid =
    (requiresUsers && selectedUserIds.length === 0) ||
    (requiresGroups && selectedGroupIds.length === 0) ||
    (requiresChurch && !churchId);

  const handleCopy = async () => {
    await onCopy(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: plan.title, text: plan.description, url: shareUrl });
      return;
    }
    await handleCopy();
  };

  const handleSave = async () => {
    if (isInvalid) return;
    const input: PlanPrivacyInput = {
      visibility,
      allowPdfDownload,
      selectedGroupIds,
      selectedUserIds,
    };
    const normalized = normalizePlanPrivacy(input);
    await onSave({
      ...normalized,
      churchId: visibility === 'church' ? churchId : plan.churchId,
    });
  };

  return (
    <div className="plan-share-modal fixed inset-0 z-[100] flex items-end justify-center bg-black/55 px-3 py-4 backdrop-blur-sm md:items-center print:hidden" role="dialog" aria-modal="true" aria-labelledby="plan-share-title">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-bible-darkPaper">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper">
          <div>
            <h2 id="plan-share-title" className="text-base font-black text-gray-900 dark:text-white">Privacidade e convites</h2>
            <p className="mt-1 text-xs font-medium text-gray-500">Controle quem pode acessar as aulas, copie o link ou convide pessoas.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-4 md:p-6">
          <section className="space-y-3">
            <label htmlFor="plan-share-url" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Link da sala</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="plan-share-url"
                value={shareUrl}
                readOnly
                className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
              <button type="button" onClick={handleCopy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 px-4 text-xs font-black uppercase tracking-widest text-purple-700 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:text-violet-200">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button type="button" onClick={handleNativeShare} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-black dark:bg-white dark:text-black">
                <Share2 size={15} />
                Enviar
              </button>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {[
              { id: 'public', label: 'Publico', icon: Globe, text: 'Qualquer pessoa com o link pode acessar.' },
              { id: 'invite_only', label: 'Convite', icon: Lock, text: 'Somente usuarios convidados acessam.' },
              { id: 'church', label: 'Igreja', icon: Users, text: 'Membros da igreja do pastor.' },
              { id: 'group', label: 'Grupo', icon: Users, text: 'Um grupo especifico da igreja.' },
            ].map((item) => {
              const Icon = item.icon;
              const active = visibility === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVisibility(item.id as ContentPrivacyLevel)}
                  className={`min-h-[76px] rounded-xl border p-3 text-left transition-colors ${active ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/40 dark:text-violet-200' : 'border-gray-200 text-gray-600 hover:border-purple-200 dark:border-gray-700 dark:text-gray-300'}`}
                >
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Icon size={15} /> {item.label}</span>
                  <span className="mt-2 block text-xs font-medium leading-relaxed text-gray-500">{item.text}</span>
                </button>
              );
            })}
          </section>

          {requiresUsers && (
            <section className="space-y-2">
              <label htmlFor="plan-share-users" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Convidar usuarios</label>
              <input
                id="plan-share-users"
                value={userIdsText}
                onChange={(event) => setUserIdsText(event.target.value)}
                placeholder="IDs de usuarios separados por virgula"
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-700 dark:bg-gray-900"
              />
            </section>
          )}

          {requiresGroups && (
            <section className="space-y-2">
              <label htmlFor="plan-share-groups" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grupos permitidos</label>
              <input
                id="plan-share-groups"
                value={groupIdsText}
                onChange={(event) => setGroupIdsText(event.target.value)}
                placeholder={userProfile?.churchData?.groupId || 'IDs de grupos separados por virgula'}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-700 dark:bg-gray-900"
              />
            </section>
          )}

          {isInvalid && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-300">
              Defina a audiencia antes de salvar o acesso privado.
            </p>
          )}

          <section className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                <Download size={17} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 dark:text-white">Permitir download em PDF</p>
                <p className="text-xs text-gray-500">Alunos autorizados verao o botao de PDF.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowPdfDownload((value) => !value)}
              className={`relative h-7 w-12 rounded-full transition-colors ${allowPdfDownload ? 'bg-purple-700 dark:bg-violet-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              aria-pressed={allowPdfDownload}
            >
              <span className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${allowPdfDownload ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </section>

          <section className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/80 p-3 dark:border-purple-800/50 dark:bg-purple-950/20">
            <label htmlFor="plan-share-feed" className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-violet-300">Feed do Reino</label>
            <textarea
              id="plan-share-feed"
              value={feedDescription}
              onChange={(event) => setFeedDescription(event.target.value)}
              placeholder="Escreva uma descricao breve para edificar quem vera no Feed do Reino..."
              className="min-h-20 w-full resize-none rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-purple-800/50 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => onShareFeed(feedDescription)}
              disabled={isSharingFeed || visibility !== 'public'}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500"
            >
              {isSharingFeed ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              Compartilhar no Feed do Reino
            </button>
            {visibility !== 'public' && <p className="text-xs font-medium text-gray-500">Para evitar link inacessivel, publique no feed apenas salas publicas.</p>}
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isInvalid}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-purple-900/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500"
          >
            {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
            Salvar configuracoes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanShareModal;

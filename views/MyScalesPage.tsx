"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarDays, Loader2, X } from 'lucide-react';
import SEO from '../components/SEO';
import CultoPlusPageShell from '../components/CultoPlusPageShell';
import { useAuth } from '../contexts/AuthContext';
import { churchManagementService, type UserCultoAssignment } from '../services/churchManagementService';
import {
  filterPersonalScales,
  groupPersonalScales,
  personalScalesService,
  replacePersonalScale,
  type PersonalScaleFilter,
  type PersonalScalesSnapshot,
} from '../services/personalScalesService';
import PersonalScaleList from '../components/church-management/PersonalScaleList';
import PersonalScaleDetails from '../components/church-management/PersonalScaleDetails';
import PersonalTeamsPanel, { PersonalTeamDetails } from '../components/church-management/PersonalTeamsPanel';
import VolunteerRequestsPanel, { VolunteerRequestDetails } from '../components/church-management/VolunteerRequestsPanel';
import type { ChurchFormSubmission, ChurchServiceTeam } from '../types';
import { canAccessPastoralWorkspace } from '../utils/profileAccess';

type ScaleModal =
  | { kind: 'scale'; data: UserCultoAssignment }
  | { kind: 'request'; data: ChurchFormSubmission }
  | { kind: 'team'; data: ChurchServiceTeam }
  | null;

const FILTERS: [PersonalScaleFilter, string][] = [
  ['all', 'Todas'],
  ['pending', 'Pendentes'],
  ['upcoming', 'Próximas'],
  ['history', 'Histórico'],
];

const EMPTY_SNAPSHOT: PersonalScalesSnapshot = { membership: null, assignments: [], teams: [], volunteerRequests: [] };

const EMPTY_MESSAGES: Record<PersonalScaleFilter, string> = {
  all: 'Nenhuma escala registrada para você até agora.',
  pending: 'Nenhum convite aguardando sua resposta.',
  upcoming: 'Nenhuma escala futura confirmada no momento.',
  history: 'Você ainda não tem escalas concluídas.',
};

const MyScalesPage: React.FC = () => {
  const { currentUser, userProfile, openLogin } = useAuth();
  const userId = currentUser?.uid ?? currentUser?.id ?? '';
  const [snapshot, setSnapshot] = useState<PersonalScalesSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<PersonalScaleFilter>('all');
  const [modal, setModal] = useState<ScaleModal>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error'>('info');
  const [reloadToken, setReloadToken] = useState(0);

  const profileChurchId = userProfile?.churchData?.churchId;
  const profileChurchName = userProfile?.churchData?.churchName;
  const profileChurchSlug = userProfile?.churchData?.churchSlug;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) {
        setSnapshot(EMPTY_SNAPSHOT);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await personalScalesService.loadPersonalScales(
          userId,
          profileChurchId
            ? { churchId: profileChurchId, churchName: profileChurchName ?? null, churchSlug: profileChurchSlug ?? null }
            : null,
        );
        if (active) setSnapshot(data);
      } catch (err: any) {
        if (active) setError(err?.message || 'Não foi possível carregar suas escalas.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [userId, profileChurchId, profileChurchName, profileChurchSlug, reloadToken]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  // As âncoras só existem depois do carregamento, então o scroll é reaplicado ao final.
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    const targetId = window.location.hash.replace('#', '');
    if (!targetId) return;
    window.document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
  }, [loading]);

  const groups = useMemo(() => groupPersonalScales(snapshot.assignments), [snapshot.assignments]);
  const visibleScales = useMemo(() => filterPersonalScales(snapshot.assignments, filter), [snapshot.assignments, filter]);
  const openRequests = useMemo(
    () => snapshot.volunteerRequests.filter((item) => !['answered', 'closed', 'archived'].includes(item.status)).length,
    [snapshot.volunteerRequests],
  );

  const respond = useCallback(
    async (item: UserCultoAssignment, response: 'accepted' | 'declined') => {
      setSaving(true);
      setFeedback('');
      setFeedbackTone('info');
      try {
        const updatedAssignment = await churchManagementService.respondToAssignment(item.assignment.id, userId, response);
        const updated: UserCultoAssignment = { ...item, assignment: updatedAssignment };
        setSnapshot((current) => ({ ...current, assignments: replacePersonalScale(current.assignments, updated) }));
        setModal({ kind: 'scale', data: updated });
        setFeedback(
          response === 'accepted'
            ? 'Escala confirmada. A liderança já pode acompanhar sua resposta.'
            : 'Convite recusado. A liderança será notificada.',
        );
      } catch (err) {
        setFeedbackTone('error');
        setFeedback(err instanceof Error ? err.message : 'Não foi possível registrar sua resposta.');
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const summary = [
    { label: 'Convites pendentes', value: groups.pending.length, tone: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100' },
    { label: 'Próximas escalas', value: groups.upcoming.length, tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100' },
    { label: 'Solicitações em andamento', value: openRequests, tone: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200' },
  ];

  const modalTitle = modal
    ? modal.kind === 'scale'
      ? modal.data.service?.title || modal.data.assignment.title
      : modal.kind === 'request'
        ? 'Solicitação de voluntariado'
        : modal.data.name
    : '';

  return (
    <CultoPlusPageShell
      isPastor={canAccessPastoralWorkspace(userProfile)}
      userName={userProfile?.displayName || 'Membro'}
      avatar={userProfile?.photoURL}
    >
      <SEO title="Minhas escalas" />
      <div data-module-theme="cultos" className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="module-accent-text text-xs font-semibold uppercase tracking-[0.18em]">Cultos</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Minhas escalas</h1>
            <p className="module-muted-text mt-2 max-w-2xl text-sm leading-6">
              Veja onde você serve, responda convites e acompanhe suas equipes.
            </p>
          </div>
          <Link
            href="/meus-cultos"
            className="module-focus module-accent-bg inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
          >
            Meu painel
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>

        {!currentUser ? (
          <div className="module-soft-surface module-border mt-6 grid gap-4 rounded-2xl border border-dashed p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-sm font-semibold">Entre para ver suas escalas.</h2>
              <p className="module-muted-text mt-1 text-xs">Seus convites e equipes ficam disponíveis após o login.</p>
            </div>
            <button
              type="button"
              onClick={() => openLogin()}
              className="module-focus module-accent-bg inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
              Entrar
            </button>
          </div>
        ) : loading ? (
          <div className="mt-6 flex min-h-32 items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Carregando suas escalas...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-2">
              <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="module-focus inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300 px-4 text-sm font-semibold dark:border-rose-400/40"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div data-testid="scales-summary" className="mt-6 grid gap-2 sm:grid-cols-3">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${item.tone}`}>
                    {item.value}
                  </span>
                  <span className="min-w-0 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>

            {!snapshot.membership?.churchId ? (
              <div className="module-soft-surface module-border mt-4 rounded-2xl border border-dashed p-5">
                <h2 className="text-sm font-semibold">Você ainda não está vinculado a uma igreja.</h2>
                <p className="module-muted-text mt-1 text-xs leading-5">
                  Escalas e equipes são criadas pela liderança da sua igreja. Vincule-se para receber convites de serviço.
                </p>
                <Link
                  href="/social/igrejas"
                  className="module-focus module-accent-text mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl text-xs font-semibold"
                >
                  Encontrar uma igreja <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
              <section id="escalas" aria-labelledby="personal-scales-title" className="min-w-0 scroll-mt-24">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="personal-scales-title" className="flex items-center gap-2 text-base font-semibold">
                    <CalendarDays size={18} aria-hidden="true" className="module-accent-text" />
                    Escalas e designações
                  </h2>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{visibleScales.length} item(ns)</span>
                </div>

                <div role="group" aria-label="Filtrar escalas" className="mb-4 flex gap-2 overflow-x-auto pb-1">
                  {FILTERS.map(([value, label]) => {
                    const isActive = filter === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFilter(value)}
                        className={`module-focus min-h-11 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                          isActive
                            ? 'module-accent-bg'
                            : 'border border-slate-200 text-slate-700 hover:border-[var(--module-border)] dark:border-white/10 dark:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <PersonalScaleList
                  items={visibleScales}
                  onSelect={(item) => {
                    setFeedback('');
                    setFeedbackTone('info');
                    setModal({ kind: 'scale', data: item });
                  }}
                  emptyMessage={EMPTY_MESSAGES[filter]}
                  listLabel="Lista de escalas"
                />
              </section>

              <div className="min-w-0 space-y-6">
                <VolunteerRequestsPanel
                  requests={snapshot.volunteerRequests}
                  onSelect={(submission) => setModal({ kind: 'request', data: submission })}
                />
                <PersonalTeamsPanel teams={snapshot.teams} onSelect={(team) => setModal({ kind: 'team', data: team })} />
              </div>
            </div>
          </>
        )}
      </div>

      {modal ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <div
            data-module-theme="cultos"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-scale-modal-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-[#111827] sm:max-w-xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#111827]">
              <div className="min-w-0">
                <p className="module-accent-text text-[10px] font-semibold uppercase tracking-[0.18em]">Minhas escalas</p>
                <h2 id="personal-scale-modal-title" className="mt-1 truncate text-xl font-semibold">
                  {modalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Fechar"
                className="module-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="p-5 sm:p-6">
              {modal.kind === 'scale' ? (
                <PersonalScaleDetails
                  item={modal.data}
                  feedback={feedback}
                  feedbackTone={feedbackTone}
                  saving={saving}
                  onRespond={respond}
                />
              ) : modal.kind === 'request' ? (
                <VolunteerRequestDetails submission={modal.data} />
              ) : (
                <PersonalTeamDetails team={modal.data} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </CultoPlusPageShell>
  );
};

export default MyScalesPage;

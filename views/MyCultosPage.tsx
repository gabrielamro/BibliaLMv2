"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, Clock, ExternalLink, FilePenLine, Loader2, MessageSquare, Music2, Plus, Radio, Search, Sparkles, Users } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { cultoPlusService, UserCheckedInService } from '../services/cultoPlusService';
import { personalServiceJournalService } from '../services/personalServiceJournalService';
import { ChurchServiceStatus, PersonalServiceJournal } from '../types';

const STATUS_LABELS: Record<ChurchServiceStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  live: 'Ao vivo',
  finished: 'Encerrado',
  archived: 'Arquivado',
};

const STATUS_STYLES: Record<ChurchServiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  live: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300',
  finished: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  archived: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

type UnifiedCultoItem =
  | { kind: 'official'; sortDate: string; item: UserCheckedInService }
  | { kind: 'manual'; sortDate: string; item: PersonalServiceJournal };

type FilterMode = 'all' | 'official' | 'manual' | 'prayers' | 'decisions';

const formatServiceDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatJournalDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
};

const getJournalSearchText = (journal: PersonalServiceJournal) => [
  journal.title,
  journal.churchName,
  journal.theme,
  journal.preacherName,
  journal.messageNotes,
  ...journal.tags,
  ...journal.songs.map((song) => song.title),
  ...journal.verses.map((verse) => verse.reference),
].join(' ').toLowerCase();

const MyCultosPage: React.FC = () => {
  const { currentUser, openLogin } = useAuth();
  const [officialItems, setOfficialItems] = useState<UserCheckedInService[]>([]);
  const [manualItems, setManualItems] = useState<PersonalServiceJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      const userId = currentUser?.uid ?? currentUser?.id;
      if (!userId) {
        setOfficialItems([]);
        setManualItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [checkedInServices, journals] = await Promise.all([
          cultoPlusService.getUserCheckedInServices(userId, 48),
          personalServiceJournalService.getJournalsByUser(userId, { limit: 48 }),
        ]);
        if (active) {
          setOfficialItems(checkedInServices);
          setManualItems(journals);
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Nao foi possivel carregar seus cultos.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [currentUser?.uid, currentUser?.id]);

  const liveCount = useMemo(() => officialItems.filter(({ service }) => service.status === 'live').length, [officialItems]);

  const unifiedItems = useMemo<UnifiedCultoItem[]>(() => {
    const query = search.trim().toLowerCase();
    const official: UnifiedCultoItem[] = officialItems
      .filter(({ service }) => filter === 'all' || filter === 'official')
      .filter(({ service }) => !query || [service.title, service.theme, service.churchName, service.keyVerseRef].join(' ').toLowerCase().includes(query))
      .map((item) => ({ kind: 'official', sortDate: item.checkedInAt, item }));

    const manual: UnifiedCultoItem[] = manualItems
      .filter((journal) => {
        if (filter === 'official') return false;
        if (filter === 'prayers') return journal.prayers.length > 0;
        if (filter === 'decisions') return journal.decisions.length > 0;
        return filter === 'all' || filter === 'manual';
      })
      .filter((journal) => !query || getJournalSearchText(journal).includes(query))
      .map((item) => ({ kind: 'manual', sortDate: item.serviceDate || item.createdAt, item }));

    return [...official, ...manual].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  }, [filter, manualItems, officialItems, search]);

  return (
    <div className="h-full overflow-y-auto bg-[#f7fafc] p-4 dark:bg-black/20 md:p-8">
      <SEO title="Meus Cultos" />
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
        <div className="bg-gradient-to-r from-cyan-950 via-sky-800 to-rose-400 p-6 text-white md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-50 ring-1 ring-white/20">
                <Sparkles size={12} />
                Meu Culto
              </p>
              <h1 className="mt-3 flex items-center gap-2 text-2xl font-medium">
                <FilePenLine className="text-rose-100" />
                Meus Cultos
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-widest text-cyan-50/90">
                <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">{officialItems.length} Culto+</span>
                <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">{manualItems.length} registros pessoais</span>
                <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">{liveCount} ao vivo</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/meus-cultos/novo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-cyan-950 shadow-sm transition hover:bg-rose-50">
                <Plus size={16} />
                Registrar culto
              </Link>
              <Link href="/social/igrejas" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-white ring-1 ring-white/20 transition hover:bg-white/20">
                Ver igrejas
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {!currentUser ? (
            <div className="grid gap-4 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 p-5 dark:border-cyan-950/40 dark:bg-cyan-950/20 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-sm font-medium text-cyan-950 dark:text-cyan-100">Entre para ver seus cultos.</h2>
                <p className="mt-1 text-xs font-medium text-cyan-800/70 dark:text-cyan-200/70">
                  Seus check-ins e registros pessoais ficam guardados aqui.
                </p>
              </div>
              <button onClick={() => openLogin()} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-900 px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-white">
                Entrar
              </button>
            </div>
          ) : loading ? (
            <div className="flex min-h-28 items-center justify-center gap-2 text-sm font-medium text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Carregando seus cultos...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600 dark:border-red-950/40 dark:bg-red-950/20">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700/45" size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por igreja, tema, musica, versiculo..."
                    className="min-h-12 w-full rounded-2xl border border-cyan-100 bg-cyan-50/50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {([
                    ['all', 'Todos'],
                    ['official', 'Culto+'],
                    ['manual', 'Registros'],
                    ['prayers', 'Oracoes'],
                    ['decisions', 'Decisoes'],
                  ] as [FilterMode, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`shrink-0 rounded-2xl px-4 py-3 text-[10px] font-medium uppercase tracking-widest transition ${filter === value ? 'bg-cyan-900 text-white shadow-sm' : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-100'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {unifiedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 p-8 text-center dark:border-cyan-950/40 dark:bg-cyan-950/20">
                  <FilePenLine size={28} className="mx-auto mb-3 text-cyan-700 dark:text-cyan-300" />
                  <h2 className="text-sm font-medium text-cyan-950 dark:text-cyan-100">Nenhum culto encontrado.</h2>
                  <p className="mx-auto mt-2 max-w-md text-xs font-medium text-cyan-800/70 dark:text-cyan-200/70">
                    Faca check-in em uma OnePage ou registre manualmente um culto que voce participou.
                  </p>
                  <Link href="/meus-cultos/novo" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-900 px-5 text-[10px] font-medium uppercase tracking-widest text-white">
                    <Plus size={14} />
                    Registrar culto
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {unifiedItems.map((entry) => entry.kind === 'official' ? (
                    <OfficialCultoCard key={`official_${entry.item.service.id}_${entry.item.checkedInAt}`} item={entry.item} />
                  ) : (
                    <ManualCultoCard key={`manual_${entry.item.id}`} journal={entry.item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const OfficialCultoCard: React.FC<{ item: UserCheckedInService }> = ({ item }) => {
  const { service, checkedInAt } = item;
  return (
    <article className="flex min-h-56 flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:border-emerald-200 hover:bg-white dark:border-emerald-900/40 dark:bg-emerald-950/10">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest ${STATUS_STYLES[service.status]}`}>
            {STATUS_LABELS[service.status]}
          </span>
          <Link href={`/culto/${service.slug}`} className="rounded-full bg-white p-2 text-gray-400 transition hover:text-emerald-600 dark:bg-bible-darkPaper" aria-label={`Abrir ${service.title}`}>
            <ExternalLink size={13} />
          </Link>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Culto+</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-tight text-gray-900 dark:text-white">{service.title}</h3>
        {service.theme && <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500 dark:text-gray-400">{service.theme}</p>}
        <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
          Check-in em {formatServiceDate(checkedInAt)}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><CalendarDays size={11} /> {formatServiceDate(service.startsAt)}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><Users size={11} /> {service.checkinsCount ?? 0}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><MessageSquare size={11} /> {service.postsCount ?? 0}</span>
        </div>
        <Link href={`/culto/${service.slug}`} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-[10px] font-medium uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-700 hover:text-white dark:bg-bible-darkPaper">
          Acompanhar
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
};

const ManualCultoCard: React.FC<{ journal: PersonalServiceJournal }> = ({ journal }) => (
  <article className="flex min-h-56 flex-col justify-between rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-rose-50/70 p-4 transition hover:border-cyan-200 dark:border-cyan-950/40 dark:from-cyan-950/20 dark:via-bible-darkPaper dark:to-rose-950/10">
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">
          Registro pessoal
        </span>
        <Link href={`/meus-cultos/${journal.id}`} className="rounded-full bg-white p-2 text-cyan-700 transition hover:text-rose-500 dark:bg-bible-darkPaper" aria-label={`Abrir ${journal.title}`}>
          <FilePenLine size={13} />
        </Link>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{journal.churchName}</p>
      <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-tight text-gray-900 dark:text-white">{journal.title}</h3>
      {journal.theme && <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500 dark:text-gray-400">{journal.theme}</p>}
      <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
        {formatJournalDate(journal.serviceDate)}
      </p>
    </div>
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><Music2 size={11} /> {journal.songs.length}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><BookOpen size={11} /> {journal.verses.length}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><MessageSquare size={11} /> {journal.prayers.length}</span>
      </div>
      <Link href={`/meus-cultos/${journal.id}`} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-900 px-3 text-[10px] font-medium uppercase tracking-widest text-white transition hover:bg-rose-500">
        Revisar
        <ArrowRight size={13} />
      </Link>
    </div>
  </article>
);

export default MyCultosPage;

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, ExternalLink, Loader2, MessageSquare, Plus, Radio, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from '../../utils/router';
import { cultoPlusService } from '../../services/cultoPlusService';
import { ChurchService, ChurchServiceStatus } from '../../types';

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

const CultoPlusWorkspacePreview: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const churchId = userProfile?.churchData?.churchId;
  const [services, setServices] = useState<ChurchService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadServices = async () => {
      if (!churchId) {
        setServices([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const loaded = await cultoPlusService.getServicesByChurch(churchId, { includeDrafts: true, limit: 5 });
        if (active) setServices(loaded);
      } catch (err: any) {
        if (active) setError(err?.message || 'Nao foi possivel carregar os cultos.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadServices();
    return () => {
      active = false;
    };
  }, [churchId]);

  const liveCount = useMemo(() => services.filter((service) => service.status === 'live').length, [services]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper">
      <div className="bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] p-6 text-white md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50 ring-1 ring-white/20">
              <Sparkles size={12} />
              Culto+
            </p>
            <h2 className="mt-3 flex items-center gap-2 text-2xl font-black">
              <Radio className="text-[#f3d28a]" />
              Cultos Criados
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-50/90">
              <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">{services.length} recentes</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">{liveCount} ao vivo</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate('/workspace-pastoral/cultos/novo')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3d28a] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[#073b35] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Plus size={16} />
              Novo Culto+
            </button>
            <button
              onClick={() => navigate('/workspace-pastoral/cultos')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Ver todos
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/workspace-pastoral/cultos?view=calendar')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <CalendarDays size={16} />
              Calendario
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {!churchId ? (
          <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 p-5 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
            Vincule seu perfil a uma igreja para criar e acompanhar cultos.
          </div>
        ) : loading ? (
          <div className="flex min-h-28 items-center justify-center gap-2 text-sm font-bold text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Carregando cultos...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-600 dark:border-red-950/40 dark:bg-red-950/20">
            {error}
          </div>
        ) : services.length === 0 ? (
          <div className="grid gap-4 rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-100">Nenhum culto criado ainda.</h3>
              <p className="mt-1 text-xs font-medium text-emerald-800/70 dark:text-emerald-200/70">
                Comece criando uma OnePage de culto com check-in, liturgia e acompanhamento.
              </p>
            </div>
            <button
              onClick={() => navigate('/workspace-pastoral/cultos/novo')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#073b35] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
            >
              <Plus size={15} />
              Novo Culto+
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            {services.map((service) => (
              <article key={service.id} className="flex min-h-44 flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-emerald-200 hover:bg-white dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-emerald-900/60">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${STATUS_STYLES[service.status]}`}>
                      {STATUS_LABELS[service.status]}
                    </span>
                    <Link href={`/culto/${service.slug}`} className="rounded-full bg-white p-2 text-gray-400 transition hover:text-emerald-600 dark:bg-bible-darkPaper" aria-label={`Abrir ${service.title}`}>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-black leading-tight text-gray-900 dark:text-white">{service.title}</h3>
                  {service.theme && <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500 dark:text-gray-400">{service.theme}</p>}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><CalendarDays size={11} /> {formatServiceDate(service.startsAt)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><Clock size={11} /> {service.liturgyItems.length}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><Users size={11} /> {service.checkinsCount ?? 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-bible-darkPaper"><MessageSquare size={11} /> {service.postsCount ?? 0}</span>
                  </div>
                  <button
                    onClick={() => navigate('/workspace-pastoral/cultos')}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-700 hover:text-white dark:bg-bible-darkPaper dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                  >
                    Acompanhar
                    <ArrowRight size={13} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CultoPlusWorkspacePreview;

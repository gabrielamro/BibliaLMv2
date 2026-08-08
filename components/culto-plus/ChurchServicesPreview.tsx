"use client";

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock, Radio, Sparkles } from 'lucide-react';
import { ChurchService } from '../../types';
import { getLiveStatusLabel } from '../../utils/cultoPlusOnePage';
import { filterServicesByModality, type ServiceModalityFilter as ServiceModalityFilterValue } from '../../utils/serviceModality';
import ServiceModalityFilter from './ServiceModalityFilter';
import { ServiceModalityBadge, ServiceParticipationHint } from './ServiceModalityBadge';

const formatServiceDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getServicePreviewStatus = (service: ChurchService, wasAttended: boolean) => {
  const now = new Date();
  const temporalLabel = getLiveStatusLabel(service, now);
  if (temporalLabel === 'Terminou' && wasAttended) return 'Assistido';
  return temporalLabel;
};

type ChurchServicesPreviewProps = {
  services: ChurchService[];
  canManage?: boolean;
  attendedServiceIds?: Set<string>;
  /** Endereço físico da igreja usado no rótulo dos cultos presenciais. */
  locationLabel?: string;
};

const ChurchServicesPreview: React.FC<ChurchServicesPreviewProps> = ({ services, canManage, attendedServiceIds, locationLabel }) => {
  const [modalityFilter, setModalityFilter] = useState<ServiceModalityFilterValue>('presencial');
  const visibleServices = useMemo(() => filterServicesByModality(services, modalityFilter), [services, modalityFilter]);

  return (
    <div className="space-y-4" data-module-theme="cultos">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="module-accent-text text-[10px] font-black uppercase tracking-[0.2em]">Culto+</p>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Acompanhamento de cultos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Agenda da igreja com check-in, anotações e postagens do culto.
          </p>
        </div>
        {canManage && (
          <Link
            href="/workspace-pastoral/cultos/novo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:shadow-xl dark:from-[#0b4a41] dark:via-[#117566] dark:to-[#f3d28a] dark:text-[#062a26]"
          >
            <Sparkles size={15} />
            Novo Culto+
          </Link>
        )}
      </div>

      {services.length > 0 && (
        <ServiceModalityFilter services={services} value={modalityFilter} onChange={setModalityFilter} />
      )}

      {services.length === 0 ? (
        <div className="module-border rounded-[2rem] border border-dashed bg-white/70 p-8 text-center text-sm font-bold text-gray-500 dark:bg-black/20 dark:text-gray-300">
          Nenhum culto publicado ainda.
        </div>
      ) : visibleServices.length === 0 ? (
        <div className="module-border rounded-[2rem] border border-dashed bg-white/70 p-8 text-center dark:bg-black/20">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-300">
            {modalityFilter === 'presencial'
              ? 'Nenhum culto presencial publicado neste momento.'
              : 'Nenhum culto online publicado neste momento.'}
          </p>
          <button
            type="button"
            onClick={() => setModalityFilter('all')}
            className="module-focus module-accent-text mt-3 inline-flex min-h-11 items-center text-[10px] font-black uppercase tracking-widest"
          >
            Ver todos os cultos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleServices.map((service) => (
            (() => {
              const wasAttended = attendedServiceIds?.has(service.id) ?? false;
              const statusLabel = getServicePreviewStatus(service, wasAttended);
              return (
            <Link
              key={service.id}
              href={`/culto/${service.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-950/5 dark:border-emerald-900/40 dark:bg-bible-darkPaper"
            >
              <div className="h-28 bg-gray-100 dark:bg-gray-800 relative">
                {service.bannerUrl ? (
                  <img src={service.bannerUrl} alt={service.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#073b35] via-[#0f5d51] to-[#d8b15f]">
                    <Radio className="text-white/85" size={32} />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm ${statusLabel === 'Ao vivo' ? 'bg-red-500 text-white' : statusLabel === 'Assistido' ? 'bg-emerald-600 text-white' : 'bg-[#f3d28a] text-[#073b35]'}`}>
                    {statusLabel}
                  </span>
                  <ServiceModalityBadge service={service} />
                </div>
              </div>
              <div className="p-5">
                <h4 className="line-clamp-1 text-base font-black text-gray-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                  {service.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{service.theme}</p>
                <ServiceParticipationHint service={service} locationLabel={locationLabel} className="mt-3" />
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/40">
                    <CalendarDays size={12} />
                    {formatServiceDate(service.startsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/40">
                    <Clock size={12} />
                    {service.liturgyItems.length} etapas
                  </span>
                </div>
              </div>
            </Link>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
};

export default ChurchServicesPreview;

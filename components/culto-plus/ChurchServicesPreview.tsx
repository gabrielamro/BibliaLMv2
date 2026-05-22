"use client";

import Link from 'next/link';
import React from 'react';
import { CalendarDays, Clock, Radio, Sparkles } from 'lucide-react';
import { ChurchService } from '../../types';

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
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);
  const isFinished = service.status === 'finished' || service.status === 'archived' || now > endsAt;
  if (service.status === 'live' || (now >= startsAt && now <= endsAt)) return 'Ao vivo';
  if (isFinished && wasAttended) return 'Assistido';
  if (now < startsAt) return 'Agendado';
  return 'Publicado';
};

type ChurchServicesPreviewProps = {
  services: ChurchService[];
  canManage?: boolean;
  attendedServiceIds?: Set<string>;
};

const ChurchServicesPreview: React.FC<ChurchServicesPreviewProps> = ({ services, canManage, attendedServiceIds }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Culto+</p>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Acompanhamento de cultos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            OnePages para check-in, anotacoes e postagens do culto.
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

      {services.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-sm font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          Nenhum culto publicado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
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
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm ${statusLabel === 'Ao vivo' ? 'bg-red-500 text-white' : statusLabel === 'Assistido' ? 'bg-emerald-600 text-white' : 'bg-[#f3d28a] text-[#073b35]'}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="p-5">
                <h4 className="line-clamp-1 text-base font-black text-gray-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                  {service.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{service.theme}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
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

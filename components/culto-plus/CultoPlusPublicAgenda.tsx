"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, Radio } from 'lucide-react';
import { ChurchService } from '../../types';
import { formatCalendarDayLabel, formatServiceHour, getServiceTemporalStatus, groupServicesByDate, toLocalDateKey } from '../../utils/cultoPlusCalendar';

type CultoPlusPublicAgendaProps = {
  services: ChurchService[];
  visibleDays?: Date[];
  onOpen: (service: ChurchService) => void;
  emptyLabel?: string;
  layout?: 'list' | 'carousel';
  pageSize?: number;
};

const statusText: Record<ReturnType<typeof getServiceTemporalStatus>, string> = {
  live: 'Ao vivo',
  upcoming: 'Agendado',
  finished: 'Realizado',
};

type AgendaServiceItem = {
  service: ChurchService;
  day: Date;
};

const chunkAgendaItems = (items: AgendaServiceItem[], size: number) => {
  const chunks: AgendaServiceItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

type AgendaServiceCardProps = {
  service: ChurchService;
  onOpen: (service: ChurchService) => void;
  dayLabel?: string;
  compact?: boolean;
};

const AgendaServiceCard: React.FC<AgendaServiceCardProps> = ({ service, onOpen, dayLabel, compact = false }) => {
  const temporalStatus = getServiceTemporalStatus(service);

  return (
    <button
      type="button"
      onClick={() => onOpen(service)}
      className={`group w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 text-left transition hover:border-bible-gold hover:bg-white dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:hover:bg-bible-darkPaper ${compact ? 'flex min-h-[138px] flex-col justify-between p-4' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dayLabel && (
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {dayLabel}
            </p>
          )}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:bg-bible-darkPaper dark:text-emerald-300">
              <Clock size={11} /> {formatServiceHour(service.startsAt)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${temporalStatus === 'live' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 dark:bg-bible-darkPaper dark:text-gray-400'}`}>
              {temporalStatus === 'live' && <Radio size={9} />}
              {statusText[temporalStatus]}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-black leading-tight text-gray-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {service.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">{service.theme || service.preacherName}</p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-widest text-bible-gold">
          Abrir <ArrowRight size={10} />
        </span>
      </div>
    </button>
  );
};

const CultoPlusPublicAgenda: React.FC<CultoPlusPublicAgendaProps> = ({
  services,
  visibleDays,
  onOpen,
  emptyLabel = 'Ainda nao ha cultos publicados para este periodo.',
  layout = 'list',
  pageSize = 6,
}) => {
  const [activePage, setActivePage] = useState(0);
  const groupedServices = useMemo(() => groupServicesByDate(services), [services]);
  const agendaDays = useMemo(() => {
    if (visibleDays?.length) return visibleDays;
    const keys = Object.keys(groupedServices).sort();
    return keys.map((key) => {
      const [year, month, day] = key.split('-').map(Number);
      return new Date(year, (month ?? 1) - 1, day ?? 1);
    });
  }, [groupedServices, visibleDays]);
  const agendaItems = useMemo(
    () =>
      agendaDays.flatMap((day) => {
        const dayKey = toLocalDateKey(day);
        return (groupedServices[dayKey] ?? []).map((service) => ({ service, day }));
      }),
    [agendaDays, groupedServices],
  );
  const carouselPages = useMemo(
    () => chunkAgendaItems(agendaItems, Math.max(pageSize, 1)),
    [agendaItems, pageSize],
  );
  const lastPage = Math.max(carouselPages.length - 1, 0);
  const safeActivePage = Math.min(activePage, lastPage);

  useEffect(() => {
    setActivePage((currentPage) => Math.min(currentPage, lastPage));
  }, [lastPage]);

  if (services.length === 0 || agendaItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-center dark:border-emerald-900/50 dark:bg-emerald-950/10">
        <CalendarDays size={24} className="mx-auto mb-3 text-emerald-600" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{emptyLabel}</span>
      </div>
    );
  }

  if (layout === 'carousel') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-900/60">
            {agendaItems.length} {agendaItems.length === 1 ? 'culto' : 'cultos'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {safeActivePage + 1} de {carouselPages.length}
            </span>
            {carouselPages.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActivePage((currentPage) => Math.max(currentPage - 1, 0))}
                  disabled={safeActivePage === 0}
                  aria-label="Ver cultos anteriores"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:border-bible-gold hover:text-bible-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900/60 dark:bg-bible-darkPaper dark:text-emerald-300"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage((currentPage) => Math.min(currentPage + 1, lastPage))}
                  disabled={safeActivePage === lastPage}
                  aria-label="Ver proximos cultos"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:border-bible-gold hover:text-bible-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900/60 dark:bg-bible-darkPaper dark:text-emerald-300"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${safeActivePage * 100}%)` }}
          >
            {carouselPages.map((page, pageIndex) => (
              <div key={pageIndex} className="min-w-full">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {page.map(({ service, day }) => (
                    <AgendaServiceCard
                      key={service.id}
                      service={service}
                      onOpen={onOpen}
                      dayLabel={formatCalendarDayLabel(day)}
                      compact
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {carouselPages.length > 1 && (
          <div className="flex justify-center gap-1.5" aria-label="Paginas de cultos">
            {carouselPages.map((_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                onClick={() => setActivePage(pageIndex)}
                aria-label={`Ir para pagina ${pageIndex + 1} de cultos`}
                aria-current={safeActivePage === pageIndex ? 'page' : undefined}
                className={`h-1.5 rounded-full transition-all ${safeActivePage === pageIndex ? 'w-6 bg-emerald-700 dark:bg-emerald-300' : 'w-1.5 bg-emerald-200 dark:bg-emerald-900'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agendaDays.map((day) => {
        const dayKey = toLocalDateKey(day);
        const dayServices = groupedServices[dayKey] ?? [];
        if (dayServices.length === 0) return null;

        return (
          <div key={dayKey} className="space-y-2">
            <h4 className="px-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {formatCalendarDayLabel(day)}
            </h4>
            {dayServices.map((service) => (
              <AgendaServiceCard key={service.id} service={service} onOpen={onOpen} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default CultoPlusPublicAgenda;

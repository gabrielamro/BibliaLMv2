"use client";

import React, { useMemo } from 'react';
import { ArrowRight, CalendarDays, Clock, Radio } from 'lucide-react';
import { ChurchService } from '../../types';
import { formatCalendarDayLabel, formatServiceHour, getServiceTemporalStatus, groupServicesByDate, toLocalDateKey } from '../../utils/cultoPlusCalendar';

type CultoPlusPublicAgendaProps = {
  services: ChurchService[];
  visibleDays?: Date[];
  onOpen: (service: ChurchService) => void;
  emptyLabel?: string;
};

const statusText: Record<ReturnType<typeof getServiceTemporalStatus>, string> = {
  live: 'Ao vivo',
  upcoming: 'Agendado',
  finished: 'Realizado',
};

const CultoPlusPublicAgenda: React.FC<CultoPlusPublicAgendaProps> = ({
  services,
  visibleDays,
  onOpen,
  emptyLabel = 'Ainda nao ha cultos publicados para este periodo.',
}) => {
  const groupedServices = useMemo(() => groupServicesByDate(services), [services]);
  const agendaDays = useMemo(() => {
    if (visibleDays?.length) return visibleDays;
    const keys = Object.keys(groupedServices).sort();
    return keys.map((key) => {
      const [year, month, day] = key.split('-').map(Number);
      return new Date(year, (month ?? 1) - 1, day ?? 1);
    });
  }, [groupedServices, visibleDays]);

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-center dark:border-emerald-900/50 dark:bg-emerald-950/10">
        <CalendarDays size={24} className="mx-auto mb-3 text-emerald-600" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{emptyLabel}</span>
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
            {dayServices.map((service) => {
              const temporalStatus = getServiceTemporalStatus(service);

              return (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => onOpen(service)}
                  className="group w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left transition hover:border-bible-gold hover:bg-white dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:hover:bg-bible-darkPaper"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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
            })}
          </div>
        );
      })}
    </div>
  );
};

export default CultoPlusPublicAgenda;

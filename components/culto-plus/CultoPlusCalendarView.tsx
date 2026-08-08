"use client";

import React, { useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Radio, Users } from 'lucide-react';
import { groupServicesByDate, toLocalDateKey, formatCalendarDayLabel, formatServiceHour, getServiceTemporalStatus } from '../../utils/cultoPlusCalendar';
import { ChurchService, ServiceScheduleAssignment } from '../../types';
import { ServiceModalityBadge, ServiceParticipationHint } from './ServiceModalityBadge';

type CultoPlusCalendarViewProps = {
  services: ChurchService[];
  visibleDays: Date[];
  currentDate: Date;
  scheduleAssignments?: ServiceScheduleAssignment[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateAtDate: (date: Date) => void;
  onEdit: (service: ChurchService) => void;
  onOpenPanel: (service: ChurchService) => void;
};

const statusStyles: Record<ChurchService['status'], string> = {
  draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800',
  checkin_open: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:ring-cyan-800',
  live: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800',
  finished: 'bg-white text-gray-500 ring-1 ring-gray-200 dark:bg-bible-darkPaper dark:text-gray-400 dark:ring-gray-800',
  archived: 'bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
};

const statusLabel: Record<ChurchService['status'], string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  checkin_open: 'Check-in',
  live: 'Ao vivo',
  in_progress: 'Andamento',
  finished: 'Finalizado',
  archived: 'Arquivado',
};

const serviceTypeLabel: Record<ChurchService['serviceType'], string> = {
  sunday: 'Domingo',
  youth: 'Jovens',
  women: 'Mulheres',
  cell: 'Célula',
  conference: 'Conferência',
  vigil: 'Vigília',
  communion: 'Santa Ceia',
  other: 'Outro',
};

const EventCard: React.FC<{
  service: ChurchService;
  hasSchedule: boolean;
  compact?: boolean;
  onEdit: (service: ChurchService) => void;
  onOpenPanel: (service: ChurchService) => void;
}> = ({ service, hasSchedule, compact = false, onEdit, onOpenPanel }) => {
  const temporalStatus = getServiceTemporalStatus(service);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onOpenPanel(service)}
        className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-left shadow-sm transition hover:border-bible-gold/70 hover:bg-white dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-bible-darkPaper"
        title={`${formatServiceHour(service.startsAt)} - ${service.title}`}
      >
        <div className="mb-1 flex min-w-0 items-center justify-between gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
            <Clock size={9} className="shrink-0" />
            <span className="truncate">{formatServiceHour(service.startsAt)}</span>
          </span>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[6px] font-black uppercase tracking-wide ${statusStyles[service.status]}`}>
            {statusLabel[service.status]}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <h4 className="min-w-0 flex-1 truncate text-[10px] font-black leading-tight text-gray-900 dark:text-white">{service.title}</h4>
          {temporalStatus === 'live' && <Radio size={9} className="shrink-0 text-red-500" />}
          {hasSchedule && <Users size={9} className="shrink-0 text-emerald-700 dark:text-emerald-300" />}
        </div>
        <ServiceModalityBadge service={service} size="xs" className="mt-1" />
      </button>
    );
  }

  return (
    <button type="button" onClick={() => onOpenPanel(service)} className="w-full space-y-3 rounded-xl border border-emerald-100 bg-white p-3 text-left shadow-sm transition hover:border-bible-gold/60 dark:border-emerald-900/40 dark:bg-bible-darkPaper">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
              <Clock size={11} /> {formatServiceHour(service.startsAt)}
            </span>
            {temporalStatus === 'live' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                <Radio size={9} /> Ao vivo
              </span>
            )}
          </div>
          <h4 className="line-clamp-2 text-xs font-black leading-snug text-gray-900 dark:text-white">{service.title}</h4>
          {!compact && <p className="mt-1 line-clamp-1 text-[10px] font-bold text-gray-500">{service.theme || serviceTypeLabel[service.serviceType]}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${statusStyles[service.status]}`}>
          {statusLabel[service.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
        <span>{serviceTypeLabel[service.serviceType]}</span>
        <ServiceModalityBadge service={service} size="xs" />
        {hasSchedule && <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><Users size={10} /> Escala</span>}
      </div>
      <ServiceParticipationHint service={service} />

      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-bible-gold">
        <span>Abrir painel</span>
        <span>Editar pelo painel</span>
      </div>
    </button>
  );
};

const CultoPlusCalendarView: React.FC<CultoPlusCalendarViewProps> = ({
  services,
  visibleDays,
  currentDate,
  scheduleAssignments = [],
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreateAtDate,
  onEdit,
  onOpenPanel,
}) => {
  const groupedServices = useMemo(() => groupServicesByDate(services), [services]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate), [currentDate]);
  const todayKey = toLocalDateKey(new Date());
  const currentMonth = currentDate.getMonth();

  const hasSchedule = (serviceId: string) => scheduleAssignments.some((assignment) => assignment.serviceId === serviceId);

  return (
    <section data-module-theme="cultos" className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
            <CalendarDays size={16} />
            Calendario de cultos
          </div>
          <h3 className="mt-1 text-xl font-black capitalize text-gray-900 dark:text-white">{monthLabel}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onPreviousMonth} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 transition hover:text-emerald-700 dark:bg-bible-darkPaper">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={onToday} className="min-h-11 rounded-xl bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:text-emerald-700 dark:bg-bible-darkPaper">
            Hoje
          </button>
          <button type="button" onClick={onNextMonth} aria-label="Proximo mes" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-500 transition hover:text-emerald-700 dark:bg-bible-darkPaper">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {visibleDays.map((day) => {
          const dayKey = toLocalDateKey(day);
          const dayServices = groupedServices[dayKey] ?? [];

          if (dayServices.length === 0) return null;

          return (
            <div key={dayKey} className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-bible-darkPaper">
                <span className="text-xs font-black capitalize text-gray-900 dark:text-white">{formatCalendarDayLabel(day)}</span>
                <button type="button" onClick={() => onCreateAtDate(day)} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  <Plus size={12} /> Criar
                </button>
              </div>
              {dayServices.map((service) => (
                <EventCard key={service.id} service={service} hasSchedule={hasSchedule(service.id)} onEdit={onEdit} onOpenPanel={onOpenPanel} />
              ))}
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm font-bold text-gray-400 dark:border-gray-800 dark:bg-bible-darkPaper">
            Nenhum culto neste periodo.
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-2 pb-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {visibleDays.map((day) => {
            const dayKey = toLocalDateKey(day);
            const dayServices = groupedServices[dayKey] ?? [];
            const isToday = dayKey === todayKey;
            const isMuted = day.getMonth() !== currentMonth;

            return (
              <div key={dayKey} className={`min-h-[168px] rounded-2xl border p-2 transition ${isToday ? 'border-bible-gold bg-bible-gold/5' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-bible-darkPaper'} ${isMuted ? 'opacity-60' : ''}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${isToday ? 'bg-bible-gold text-black' : 'text-gray-500'}`}>
                    {day.getDate()}
                  </span>
                  <button type="button" onClick={() => onCreateAtDate(day)} aria-label={`Criar culto em ${day.toLocaleDateString('pt-BR')}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30">
                    <Plus size={13} />
                  </button>
                </div>

                <div className="space-y-2">
                  {dayServices.slice(0, 4).map((service) => (
                    <EventCard key={service.id} service={service} compact hasSchedule={hasSchedule(service.id)} onEdit={onEdit} onOpenPanel={onOpenPanel} />
                  ))}
                  {dayServices.length > 4 && (
                    <span className="block rounded-lg bg-gray-50 px-2 py-1 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 dark:bg-gray-900">
                      +{dayServices.length - 4} culto(s)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CultoPlusCalendarView;

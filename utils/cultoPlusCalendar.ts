import type { ChurchService } from '../types';

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export type ServiceTemporalStatus = 'live' | 'upcoming' | 'finished';

export const toLocalDateKey = (value: Date | string) => DATE_KEY_FORMATTER.format(new Date(value));

export const getCalendarMonthRange = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstVisibleDay = new Date(year, month, 1);
  firstVisibleDay.setDate(firstVisibleDay.getDate() - firstVisibleDay.getDay());
  firstVisibleDay.setHours(0, 0, 0, 0);

  const lastVisibleDay = new Date(year, month + 1, 0);
  lastVisibleDay.setDate(lastVisibleDay.getDate() + (6 - lastVisibleDay.getDay()));
  lastVisibleDay.setHours(23, 59, 59, 999);

  return {
    startDate: firstVisibleDay.toISOString(),
    endDate: lastVisibleDay.toISOString(),
    visibleDays: getDaysBetween(firstVisibleDay, lastVisibleDay),
  };
};

export const getAgendaRange = (start: Date, days: number) => {
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(days - 1, 0));
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    visibleDays: getDaysBetween(startDate, endDate),
  };
};

export const getDaysBetween = (start: Date, end: Date) => {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export const groupServicesByDate = (services: ChurchService[]) =>
  services.reduce<Record<string, ChurchService[]>>((groups, service) => {
    const key = toLocalDateKey(service.startsAt);
    const current = groups[key] ?? [];
    groups[key] = [...current, service].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    return groups;
  }, {});

export const getServiceTemporalStatus = (service: ChurchService, now = new Date()): ServiceTemporalStatus => {
  const currentTime = now.getTime();
  const startsAt = new Date(service.startsAt).getTime();
  const endsAt = new Date(service.endsAt).getTime();

  if (currentTime >= startsAt && currentTime <= endsAt) return 'live';
  if (currentTime < startsAt) return 'upcoming';
  return 'finished';
};

export const formatCalendarDayLabel = (date: Date, now = new Date()) => {
  const dateKey = toLocalDateKey(date);
  const todayKey = toLocalDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateKey === todayKey) return 'Hoje';
  if (dateKey === toLocalDateKey(tomorrow)) return 'Amanha';

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export const formatServiceHour = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

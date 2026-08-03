import type { ChurchService, ServiceLiturgyItem } from '../types';

export type ServiceCounterMode = 'upcoming' | 'running' | 'finished' | 'invalid';

export type ServiceCounterParts = {
  mode: ServiceCounterMode;
  label: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const padTime = (value: number) => String(Math.max(0, value)).padStart(2, '0');

const formatStartTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'horário informado';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const splitDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: padTime(hours),
    minutes: padTime(minutes),
    seconds: padTime(seconds),
  };
};

export const getServiceCounterParts = (service: Pick<ChurchService, 'startsAt' | 'endsAt'>, nowDate = new Date()): ServiceCounterParts => {
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { mode: 'invalid', label: 'Horario indisponivel', hours: '00', minutes: '00', seconds: '00' };
  }

  if (nowDate < startsAt) {
    return { mode: 'upcoming', label: 'Comeca em', ...splitDuration(startsAt.getTime() - nowDate.getTime()) };
  }

  if (nowDate <= endsAt) {
    return { mode: 'running', label: 'Em andamento ha', ...splitDuration(nowDate.getTime() - startsAt.getTime()) };
  }

  return { mode: 'finished', label: 'Culto encerrado', hours: '00', minutes: '00', seconds: '00' };
};

export const getLiveStatusLabel = (service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'status' | 'liveUrl'>, nowDate = new Date()) => {
  const counter = getServiceCounterParts(service, nowDate);
  if (counter.mode === 'finished') return 'Terminou';
  if (counter.mode === 'running') return 'Ao vivo';
  if (counter.mode === 'upcoming') return `Inicia às ${formatStartTime(service.startsAt)}`;
  return 'Horário indisponível';
};

export const getOfferingItem = (items: ServiceLiturgyItem[]) =>
  items.find((item) => item.kind === 'offering' && item.pixKey?.trim());

const getServiceMomentDate = (serviceStartsAt: string, momentStartsAt: string) => {
  const explicitDate = new Date(momentStartsAt);
  if (momentStartsAt.includes('T') && !Number.isNaN(explicitDate.getTime())) return explicitDate;

  const match = momentStartsAt.match(/^(\d{1,2}):(\d{2})$/);
  const serviceDate = new Date(serviceStartsAt);
  if (!match || Number.isNaN(serviceDate.getTime())) return null;

  serviceDate.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return serviceDate;
};

export const getNextServiceMomentDistanceLabel = (
  service: Pick<ChurchService, 'startsAt'>,
  momentStartsAt: string,
  nowDate = new Date(),
  referenceMomentStartsAt?: string,
) => {
  const nextDate = getServiceMomentDate(service.startsAt, momentStartsAt);
  if (!nextDate) return '';

  const referenceDate = referenceMomentStartsAt
    ? getServiceMomentDate(service.startsAt, referenceMomentStartsAt) ?? nowDate
    : nowDate;
  const minutes = Math.max(0, Math.round((nextDate.getTime() - referenceDate.getTime()) / 60000));
  if (minutes <= 0) return 'agora';
  return `em ~${minutes} min`;
};

const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const formatIcsDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

export const buildServiceCalendarEvent = (service: ChurchService, pageUrl: string) => {
  const startsAt = formatIcsDate(service.startsAt);
  const endsAt = formatIcsDate(service.endsAt);
  const description = [
    service.theme,
    service.preacherName ? `Pregador: ${service.preacherName}` : '',
    service.keyVerseRef ? `Versiculo-chave: ${service.keyVerseRef}` : '',
    pageUrl,
  ].filter(Boolean).join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CultoMais//CultoPlus//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(service.id)}@cultomais`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    startsAt ? `DTSTART:${startsAt}` : '',
    endsAt ? `DTEND:${endsAt}` : '',
    `SUMMARY:${escapeIcsText(service.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(service.churchName)}`,
    `URL:${escapeIcsText(pageUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
};

export const isSafeLiveUrl = (value: string) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
};

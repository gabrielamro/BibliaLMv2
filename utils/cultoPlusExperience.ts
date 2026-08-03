import type { ChurchService, ChurchServiceStatus, ServiceLiturgyItem, ServiceLiturgyMomentStatus, ServiceStreamStatus } from '../types';

export type WorshipExperienceMode = 'before' | 'during_with_live' | 'during_without_live' | 'after' | 'archived';

type ResolveWorshipExperienceInput = {
  serviceStatus: ChurchServiceStatus;
  streamStatus: ServiceStreamStatus;
  timeMode?: 'upcoming' | 'running' | 'finished' | 'invalid';
};

export type ServiceExperienceMoment = ServiceLiturgyItem & {
  momentStatus: ServiceLiturgyMomentStatus;
};

export const getLiturgyItemDate = (service: Pick<ChurchService, 'startsAt'>, startsAt: string) => {
  const explicitDate = new Date(startsAt);
  if (startsAt.includes('T') && !Number.isNaN(explicitDate.getTime())) return explicitDate;

  const match = startsAt.match(/^(\d{1,2}):(\d{2})$/);
  const date = new Date(service.startsAt);
  if (!match || Number.isNaN(date.getTime())) return date;
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
};

export const getLiturgyMomentForTimestamp = (
  service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'liturgyItems'>,
  timestamp: string,
) => {
  const eventDate = new Date(timestamp);
  if (Number.isNaN(eventDate.getTime())) return service.liturgyItems[0] ?? null;

  const matchedMoment = service.liturgyItems.find((item, index) => {
    const startsAt = getLiturgyItemDate(service, item.startsAt);
    const nextItem = service.liturgyItems[index + 1];
    const endsAt = nextItem ? getLiturgyItemDate(service, nextItem.startsAt) : new Date(service.endsAt);
    return eventDate >= startsAt && eventDate < endsAt;
  });
  if (matchedMoment) return matchedMoment;

  const firstMoment = service.liturgyItems[0] ?? null;
  if (!firstMoment) return null;
  const firstMomentStartsAt = getLiturgyItemDate(service, firstMoment.startsAt);
  return eventDate < firstMomentStartsAt
    ? firstMoment
    : service.liturgyItems[service.liturgyItems.length - 1] ?? null;
};

export const resolveServiceStreamStatus = (
  service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'liveUrl' | 'status'>,
  nowDate = new Date(),
): ServiceStreamStatus => {
  const hasLiveUrl = Boolean(service.liveUrl?.trim());
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 'unavailable';
  if (service.status === 'archived' || nowDate > endsAt) return 'ended';
  if (nowDate < startsAt) return hasLiveUrl ? 'upcoming' : 'not_configured';
  if (!hasLiveUrl) return 'not_configured';
  if (nowDate <= endsAt) return 'live';
  return 'upcoming';
};

export const resolveWorshipExperienceMode = ({
  serviceStatus,
  streamStatus,
  timeMode,
}: ResolveWorshipExperienceInput): WorshipExperienceMode => {
  if (serviceStatus === 'archived') return 'archived';
  if (timeMode === 'upcoming') return 'before';
  if (timeMode === 'running') return streamStatus === 'live' ? 'during_with_live' : 'during_without_live';
  if (timeMode === 'finished') return 'after';
  if (serviceStatus === 'finished') return 'after';

  if (serviceStatus === 'live' || serviceStatus === 'in_progress') {
    return streamStatus === 'live' ? 'during_with_live' : 'during_without_live';
  }

  return 'before';
};

export const getCurrentLiturgyMoment = (
  service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'liturgyItems'>,
  nowDate = new Date(),
  currentItemId?: string | null,
) => {
  if (currentItemId) {
    const liveMoment = service.liturgyItems.find((item) => item.id === currentItemId);
    if (liveMoment) return liveMoment;
  }

  return service.liturgyItems.find((item, index) => {
    const startsAt = getLiturgyItemDate(service, item.startsAt);
    const nextItem = service.liturgyItems[index + 1];
    const endsAt = nextItem ? getLiturgyItemDate(service, nextItem.startsAt) : new Date(service.endsAt);
    return nowDate >= startsAt && nowDate < endsAt;
  }) ?? service.liturgyItems[0] ?? null;
};

export const getNextLiturgyMoment = (
  service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'liturgyItems'>,
  currentMoment?: ServiceLiturgyItem | null,
) => {
  if (!currentMoment) return service.liturgyItems[0] ?? null;
  const currentIndex = service.liturgyItems.findIndex((item) => item.id === currentMoment.id);
  return currentIndex >= 0 ? service.liturgyItems[currentIndex + 1] ?? null : null;
};

export const getExperienceMoments = (
  service: Pick<ChurchService, 'startsAt' | 'endsAt' | 'liturgyItems'>,
  currentMoment?: ServiceLiturgyItem | null,
  nowDate = new Date(),
): ServiceExperienceMoment[] =>
  service.liturgyItems.map((item) => {
    if (currentMoment?.id === item.id) return { ...item, momentStatus: 'current' };

    const itemIndex = service.liturgyItems.findIndex((candidate) => candidate.id === item.id);
    const nextItem = service.liturgyItems[itemIndex + 1];
    const itemEnd = nextItem ? getLiturgyItemDate(service, nextItem.startsAt) : new Date(service.endsAt);

    return {
      ...item,
      momentStatus: nowDate > itemEnd ? 'completed' : 'pending',
    };
  });

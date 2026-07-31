import type { ServiceReactionType } from '../types';

const AUTH_RETURN_PATH_KEY = 'cultoplus.auth.returnPath';
const PENDING_CULTO_REACTION_KEY = 'cultoplus.auth.pendingCultoReaction';
const PENDING_ACTION_TTL_MS = 30 * 60 * 1000;
const REACTION_TYPES: ServiceReactionType[] = ['amen', 'glory', 'hallelujah'];

export interface PendingCultoReaction {
  serviceSlug: string;
  reactionType: ServiceReactionType;
  createdAt: string;
}

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const getSafeAuthReturnPath = (
  value: string | null | undefined,
  fallback = '/',
): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const baseUrl = 'https://cultoplus.local';
    const parsed = new URL(value, baseUrl);
    if (parsed.origin !== baseUrl || parsed.pathname === '/login') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};

export const readAuthReturnPath = (): string | null => {
  const stored = getSessionStorage()?.getItem(AUTH_RETURN_PATH_KEY);
  return stored ? getSafeAuthReturnPath(stored) : null;
};

export const storeAuthReturnPath = (path: string | null): string | null => {
  const storage = getSessionStorage();
  if (!path) {
    storage?.removeItem(AUTH_RETURN_PATH_KEY);
    return null;
  }

  const safePath = getSafeAuthReturnPath(path);
  storage?.setItem(AUTH_RETURN_PATH_KEY, safePath);
  return safePath;
};

export const storePendingCultoReaction = (
  reaction: Omit<PendingCultoReaction, 'createdAt'>,
): void => {
  getSessionStorage()?.setItem(PENDING_CULTO_REACTION_KEY, JSON.stringify({
    ...reaction,
    createdAt: new Date().toISOString(),
  }));
};

export const readPendingCultoReaction = (): PendingCultoReaction | null => {
  const storage = getSessionStorage();
  const raw = storage?.getItem(PENDING_CULTO_REACTION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingCultoReaction>;
    const createdAt = typeof parsed.createdAt === 'string'
      ? new Date(parsed.createdAt).getTime()
      : Number.NaN;
    const isValid = typeof parsed.serviceSlug === 'string'
      && parsed.serviceSlug.length > 0
      && REACTION_TYPES.includes(parsed.reactionType as ServiceReactionType)
      && Number.isFinite(createdAt)
      && Date.now() - createdAt <= PENDING_ACTION_TTL_MS;

    if (!isValid) {
      storage?.removeItem(PENDING_CULTO_REACTION_KEY);
      return null;
    }

    return parsed as PendingCultoReaction;
  } catch {
    storage?.removeItem(PENDING_CULTO_REACTION_KEY);
    return null;
  }
};

export const consumePendingCultoReaction = (
  serviceSlug: string,
): PendingCultoReaction | null => {
  const reaction = readPendingCultoReaction();
  if (!reaction || reaction.serviceSlug !== serviceSlug) return null;
  getSessionStorage()?.removeItem(PENDING_CULTO_REACTION_KEY);
  return reaction;
};

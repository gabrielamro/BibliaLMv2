import { DAILY_BREAD } from '../constants';
import { dbService, supabase } from './supabase';
import type { ResolvedDevotionalCandidate } from './devotionalResolverCore';
import { toDevotionalErrorMessage, toErrorCode } from './devotionalErrorMessage';

interface ResolveUserDailyDevotionalInput {
  userId?: string | null;
  forceNew?: boolean;
}

export class DailyDevotionalError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'DailyDevotionalError';
    this.status = status;
    this.code = code;
  }
}

export { toDevotionalErrorMessage, toErrorCode } from './devotionalErrorMessage';

const getManausDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Manaus',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const toDateId = (value?: string | null) => (value || getManausDate()).replace(/\//g, '-');

const asDailyDevotionalError = (error: unknown, fallbackStatus = 500): DailyDevotionalError => {
  if (error instanceof DailyDevotionalError) return error;
  if (error instanceof Error) {
    return new DailyDevotionalError(toDevotionalErrorMessage(error), fallbackStatus);
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const status = typeof record.status === 'number' ? record.status : fallbackStatus;
    return new DailyDevotionalError(
      toDevotionalErrorMessage(error),
      status,
      toErrorCode(record.code ?? record),
    );
  }
  return new DailyDevotionalError(toDevotionalErrorMessage(error), fallbackStatus);
};

export const normalizeDevotionalCandidate = (data: any, fallbackDate?: string): ResolvedDevotionalCandidate | null => {
  if (!data) return null;
  const date = toDateId(data.date || fallbackDate);
  const verseReference = String(data.verseReference ?? data.verse_reference ?? data.reference ?? '').trim();
  const verseText = String(data.verseText ?? data.verse_text ?? data.verse ?? '').trim();
  const content = String(data.content ?? data.text ?? '').trim();
  const prayer = String(data.prayer ?? '').trim();
  if (!verseReference || !verseText || !content || !prayer) return null;

  return {
    id: String(data.id || `daily:${date}`),
    contentId: data.contentId ?? data.content_id,
    date,
    title: String(data.title || 'Pão Diário'),
    verseReference,
    verseText,
    content,
    prayer,
    source: data.source,
    refreshAvailable: Boolean(data.refreshAvailable),
    refreshUsedAt: data.refreshUsedAt ?? null,
    personalized: Boolean(data.personalized),
  };
};

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const loadFromServer = async (forceNew: boolean) => {
  const accessToken = await getAccessToken();
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch('/api/devotional/daily', {
      method: forceNew ? 'POST' : 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DailyDevotionalError(
      toDevotionalErrorMessage(payload?.error, 'Não foi possível carregar o Pão Diário.'),
      response.status,
      toErrorCode(payload?.code ?? payload?.error),
    );
  }
  return normalizeDevotionalCandidate(payload);
};

const loadReadOnlyFallback = async () => {
  const date = getManausDate();
  try {
    const legacy = normalizeDevotionalCandidate(await dbService.getDailyDevotional(), date);
    if (legacy) return { ...legacy, refreshAvailable: false };
  } catch (error) {
    console.warn('Daily devotional read-only fallback failed:', toDevotionalErrorMessage(error));
  }
  return normalizeDevotionalCandidate({
    ...DAILY_BREAD,
    id: `daily:${date}:fallback`,
    date,
    source: 'catalog',
    refreshAvailable: false,
  }, date);
};

export const resolveUserDailyDevotional = async ({ forceNew = false }: ResolveUserDailyDevotionalInput) => {
  try {
    const resolved = await loadFromServer(forceNew);
    if (resolved) return resolved;
    throw new DailyDevotionalError('O conteúdo recebido está incompleto.', 502);
  } catch (error) {
    const normalized = asDailyDevotionalError(error);
    if (forceNew) throw normalized;
    console.warn(
      'Daily devotional API unavailable; using read-only fallback:',
      normalized.message,
      normalized.code ? `(${normalized.code})` : '',
    );
    return loadReadOnlyFallback();
  }
};

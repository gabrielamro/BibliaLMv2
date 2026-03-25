import { generateDailyDevotional } from './pastorAgent';
import { dbService } from './supabase';
import {
  normalizeVerseReference,
  pickResolvedDevotional,
  type ResolvedDevotionalCandidate,
} from './devotionalResolverCore';

interface ResolveUserDailyDevotionalInput {
  userId?: string | null;
}

const USER_DEVOTIONAL_SETTING_PREFIX = 'user_devotional_resolution';
const SIX_MONTHS_IN_DAYS = 183;

const toDateId = (value?: string | null) => (value || new Date().toISOString().split('T')[0]).replace(/\//g, '-');

export const normalizeDevotionalCandidate = (data: any, fallbackDate?: string): ResolvedDevotionalCandidate | null => {
  if (!data) return null;

  const date = toDateId(data.date || fallbackDate);
  const stableId =
    typeof data.id === 'string' && data.id.startsWith('daily:')
      ? data.id
      : `daily:${date}`;

  return {
    id: stableId,
    date,
    title: data.title || 'Pao Diario',
    verseReference: data.verseReference ?? data.reference ?? '',
    verseText: data.verseText ?? data.verse ?? '',
    content: data.content ?? data.text ?? '',
    prayer: data.prayer ?? '',
    source: data.source,
  };
};

const getUserResolutionKey = (userId: string, date: string) => `${USER_DEVOTIONAL_SETTING_PREFIX}:${userId}:${date}`;

const getSixMonthWindowStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - SIX_MONTHS_IN_DAYS);
  return date.toISOString().split('T')[0];
};

const buildGeneratedAltId = (date: string, verseReference: string) => {
  const slug = normalizeVerseReference(verseReference).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `daily:${date}:alt:${slug || 'generated'}`;
};

const createGeneratedCandidate = (raw: any, date: string): ResolvedDevotionalCandidate | null => {
  const normalized = normalizeDevotionalCandidate(raw, date);
  if (!normalized) return null;
  return {
    ...normalized,
    id: buildGeneratedAltId(date, normalized.verseReference),
    date,
    source: 'generated',
  };
};

const collectSeenVerseReferences = async (userId: string) => {
  const history = await dbService.getUserDevotionalHistory(userId, 240);
  const windowStart = getSixMonthWindowStart();
  const recentHistory = history.filter((entry: any) => {
      const entryDate = toDateId(entry.date || entry.created_at);
      return entryDate >= windowStart;
    });

  const contentIds = recentHistory.map((entry: any) => entry.content_id).filter(Boolean);

  if (contentIds.length === 0) {
    return [];
  }

  const devotionals = await dbService.getDailyDevotionalsByContentIds(contentIds);
  const verseReferences = devotionals
    .map((item: any) => item.verseReference ?? item.reference ?? '')
    .filter(Boolean);

  for (const entry of recentHistory) {
    if (typeof entry.content_id !== 'string' || !entry.content_id.includes(':alt:')) {
      continue;
    }

    const entryDate = toDateId(entry.date || entry.created_at);
    const persisted = await dbService.getUserScopedSetting(getUserResolutionKey(userId, entryDate));
    if (persisted?.id === entry.content_id && persisted?.verseReference) {
      verseReferences.push(persisted.verseReference);
    }
  }

  return verseReferences;
};

const persistUserResolution = async (userId: string, candidate: ResolvedDevotionalCandidate) => {
  await dbService.saveUserScopedSetting(getUserResolutionKey(userId, candidate.date), candidate);
  await dbService.saveUserDevotionalAction(userId, candidate.id, 'view');
};

const generateUniqueFallback = async (date: string, seenVerseReferences: string[]) => {
  const seen = new Set(seenVerseReferences.map(normalizeVerseReference));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generated = await generateDailyDevotional(true, 'bigpickle', { excludedVerseReferences: seenVerseReferences });
    const candidate = createGeneratedCandidate(generated, date);

    if (!candidate) {
      continue;
    }

    if (!seen.has(normalizeVerseReference(candidate.verseReference))) {
      return candidate;
    }
  }

  return null;
};

export const resolveUserDailyDevotional = async ({ userId }: ResolveUserDailyDevotionalInput) => {
  let officialRaw = await dbService.getDailyDevotional();

  if (!officialRaw) {
    const todayDate = toDateId(new Date().toISOString());
    const generatedOfficial = await generateDailyDevotional(true);
    if (generatedOfficial) {
      officialRaw = {
        date: todayDate,
        title: generatedOfficial.title,
        verseReference: generatedOfficial.verseReference,
        verseText: generatedOfficial.verseText,
        content: generatedOfficial.content,
        prayer: generatedOfficial.prayer,
      };
      await dbService.saveAdminDevotional(officialRaw);
    }
  }

  const official = normalizeDevotionalCandidate(officialRaw);

  if (!official) {
    return null;
  }

  if (!userId) {
    return official;
  }

  const persisted = normalizeDevotionalCandidate(
    await dbService.getUserScopedSetting(getUserResolutionKey(userId, official.date)),
    official.date,
  );

  const seenVerseReferences = await collectSeenVerseReferences(userId);
  const fallbackPool = (await dbService.getRecentDailyDevotionals(240))
    .map((item: any) => normalizeDevotionalCandidate(item))
    .filter(Boolean)
    .filter((candidate): candidate is ResolvedDevotionalCandidate => Boolean(candidate))
    .filter((candidate) => candidate.id !== official.id);

  const picked = pickResolvedDevotional({
    official: { ...official, source: 'official' },
    persistedForToday: persisted,
    fallbackPool,
    seenVerseReferences,
  });

  if (picked) {
    if (!persisted) {
      await persistUserResolution(userId, picked);
    }
    return picked;
  }

  const generated = await generateUniqueFallback(official.date, seenVerseReferences);
  if (!generated) {
    return official;
  }

  await persistUserResolution(userId, generated);
  return generated;
};

import { generateDailyDevotional } from './pastorAgent';
import { dbService } from './supabase';
import {
  normalizeVerseReference,
  type ResolvedDevotionalCandidate,
} from './devotionalResolverCore';

interface ResolveUserDailyDevotionalInput {
  userId?: string | null;
  forceNew?: boolean;
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

export const resolveUserDailyDevotional = async ({ userId, forceNew }: ResolveUserDailyDevotionalInput) => {
  const todayDate = toDateId(new Date().toISOString());

  // Se o usuário pediu para atualizar, gera um exclusivo para ele
  if (forceNew && userId) {
      const seenVerseReferences = await collectSeenVerseReferences(userId);
      const fallback = await generateUniqueFallback(todayDate, seenVerseReferences);
      
      let candidate = fallback;
      if (!candidate) {
          const generated = await generateDailyDevotional(true);
          candidate = createGeneratedCandidate(generated, todayDate);
      }
      
      if (candidate) {
          await persistUserResolution(userId, candidate);
          return candidate;
      }
  }

  // Verificar se O USUÁRIO já tem um devocional (oficial gerado localmente ou um personalizado que foi gerado em sessões anteriores) para hoje! 
  // Isso previne chamadas infinitas caso o ADMIN DEVOTIONAL DB falhe em salvar o novo gerado.
  if (userId) {
     const settingsKey = getUserResolutionKey(userId, todayDate);
     // 1. Tenta recuperar do localStorage (cache relâmpago local infalível)
     if (typeof window !== 'undefined') {
         const localCached = localStorage.getItem(settingsKey);
         if (localCached) {
             const parsed = normalizeDevotionalCandidate(JSON.parse(localCached), todayDate);
             if (parsed) return parsed;
         }
     }
     
     // 2. Se não tem no localStorage, tenta do DB (pode falhar se a tabela não existir)
     const persisted = normalizeDevotionalCandidate(
        await dbService.getUserScopedSetting(settingsKey),
        todayDate
     );
     if (persisted) {
         if (typeof window !== 'undefined') localStorage.setItem(settingsKey, JSON.stringify(persisted));
         return persisted; // Se tem, usa ele e nem tenta gerar um oficial novo!
     }
  }

  // Tenta puxar o oficial do banco
  let officialRaw = await dbService.getDailyDevotional();
  const isFromToday = officialRaw?.date === todayDate;

  // Se o banco está atrasado, a IA gera um pra hoje
  if (!officialRaw || !isFromToday) {
    // Busca devocionais do último ano para não repetir referências
    const pastYearDevotionals = await dbService.getRecentDailyDevotionals(365);
    const seenReferences = pastYearDevotionals
        .map((d: any) => d.reference || d.verseReference)
        .filter(Boolean);

    const generatedOfficial = await generateDailyDevotional(true, 'bigpickle', { excludedVerseReferences: seenReferences });
    if (generatedOfficial) {
      officialRaw = {
        date: todayDate,
        title: generatedOfficial.title,
        reference: generatedOfficial.verseReference || generatedOfficial.reference,
        verse: generatedOfficial.verseText || generatedOfficial.verse,
        text: generatedOfficial.content || generatedOfficial.text,
        prayer: generatedOfficial.prayer,
      };
      // Tenta salvar no banco como "oficial do dia"
      await dbService.saveAdminDevotional(officialRaw);
    }
  }

  const official = normalizeDevotionalCandidate(officialRaw);

  if (!official) {
    return null;
  }

  if (userId) {
     // Primeira vez do dia pra esse usuario, gravar o "view"
     const picked = { ...official, source: 'official' } as ResolvedDevotionalCandidate;
     await persistUserResolution(userId, picked);
     
     // Força no cache local para blindar contra falha silenciosa de DB (RLS ou tabela inexistente)
     if (typeof window !== 'undefined') {
         localStorage.setItem(getUserResolutionKey(userId, todayDate), JSON.stringify(picked));
     }
     
     return picked;
  }

  return official;
};

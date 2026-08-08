import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import completeBible from '../../../../biblia_completa.json';

import { SUBSCRIPTION_PLANS } from '../../../../constants';
import { canAccessAiChat } from '../../../../services/aiChatAccessPolicy';
import {
  findBibleQuote,
  getBibleQuoteSearchTerms,
  type BibleQuoteCandidate,
} from '../../../../services/bibleQuoteResolver';
import {
  generateWithCloudflareWorkersAi,
  isCloudflareWorkersAiConfigured,
  type CloudflareAiMessage,
} from '../../../../services/cloudflareAiService';
import { retryWithBackoff } from '../../../../services/retryWithBackoff';

export const dynamic = 'force-dynamic';

type BundledBibleBook = {
  id: string;
  name: string;
  chapters: string[][];
};

const bundledBibleBooks = completeBible as BundledBibleBook[];
const bookNamesById = new Map(bundledBibleBooks.map((book) => [book.id, book.name]));
const bundledBibleVerses: BibleQuoteCandidate[] = bundledBibleBooks.flatMap((book) => book.chapters.flatMap(
  (chapter, chapterIndex) => chapter.map((text, verseIndex) => ({
    bookId: book.id,
    bookName: book.name,
    chapter: chapterIndex + 1,
    verse: verseIndex + 1,
    text,
  })),
));

const SYSTEM_INSTRUCTION = `Você é o Obreiro IA do Culto+, um auxiliar de estudo bíblico.
Responda em português brasileiro com tom pastoral, acolhedor, sábio e humilde.
Baseie afirmações bíblicas em referências verificáveis e diferencie claramente o texto bíblico de interpretações pastorais.
Não invente referências. Quando não tiver segurança, diga que não sabe.
Não substitua aconselhamento pastoral, médico, jurídico ou psicológico profissional.`;

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing.');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});

const readBearerToken = (request: NextRequest) => {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

const readObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const readFeatureMatrix = (value: unknown): Record<string, { aiChatAccess?: boolean }> | undefined => {
  const settings = readObject(value);
  const matrix = settings.featuresMatrix;
  return matrix && typeof matrix === 'object'
    ? matrix as Record<string, { aiChatAccess?: boolean }>
    : undefined;
};

const getManausDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Manaus',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const normalizeMessages = (value: unknown, context: unknown): CloudflareAiMessage[] => {
  const rawMessages = Array.isArray(value) ? value.slice(-20) : [];
  const messages: CloudflareAiMessage[] = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
  const safeContext = String(context ?? '').trim().slice(0, 2000);
  if (safeContext) messages.push({ role: 'system', content: `Contexto adicional: ${safeContext}` });

  for (const item of rawMessages) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as { role?: unknown; content?: unknown };
    const content = String(candidate.content ?? '').trim().slice(0, 4000);
    if (!content) continue;
    messages.push({
      role: candidate.role === 'model' || candidate.role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  }
  return messages;
};

const findBibleQuoteInDatabase = async (
  admin: ReturnType<typeof getAdminClient>,
  query: string,
): Promise<BibleQuoteCandidate | null> => {
  const terms = getBibleQuoteSearchTerms(query);
  if (terms.length < 2) return null;

  let verseQuery = admin
    .from('bible_verses')
    .select('book_id, chapter, verse, text')
    .limit(20);

  for (const term of terms) verseQuery = verseQuery.ilike('text', `%${term}%`);

  const { data, error } = await verseQuery;
  if (error) throw error;

  return findBibleQuote(query, (data ?? []).map((item) => ({
    bookId: item.book_id,
    bookName: bookNamesById.get(item.book_id) ?? item.book_id,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text,
  })));
};

const formatBibleQuoteAnswer = (match: BibleQuoteCandidate) => [
  'Encontrei esta passagem na base bíblica do Culto+:',
  '',
  `**${match.bookName} ${match.chapter}:${match.verse}**`,
  `“${match.text}”`,
  '',
  'A referência e o texto acima foram recuperados da base bíblica, sem uso de IA para identificá-los.',
].join('\n');

export async function POST(request: NextRequest) {
  try {
    const token = readBearerToken(request);
    if (!token) return json({ error: 'Entre na sua conta para usar o Obreiro IA.' }, 401);
    const admin = getAdminClient();
    const { data: authData } = await admin.auth.getUser(token);
    const user = authData.user;
    if (!user) return json({ error: 'Sua sessão expirou. Entre novamente.' }, 401);

    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin
        .from('profiles')
        .select('subscription_tier, usage_today')
        .eq('id', user.id)
        .maybeSingle(),
      admin
        .from('settings')
        .select('value')
        .eq('key', 'global')
        .maybeSingle(),
    ]);

    const tier = String(profile?.subscription_tier ?? 'free');
    if (!canAccessAiChat({ subscriptionTier: tier, featuresMatrix: readFeatureMatrix(settings?.value) })) {
      return json({ error: 'Seu plano atual não inclui o Obreiro IA.' }, 403);
    }

    const plan = SUBSCRIPTION_PLANS.find((candidate) => candidate.id === tier) ?? SUBSCRIPTION_PLANS[0];
    const today = getManausDate();
    const storedUsage = readObject(profile?.usage_today);
    const usage = storedUsage.date === today ? storedUsage : {};
    const chatCount = Number(usage.chatCount ?? 0);
    if (chatCount >= plan.limits.chat) {
      return json({ error: 'Sua cota diária de mensagens foi atingida.' }, 429);
    }

    const body = await request.json().catch(() => ({}));
    const messages = normalizeMessages(body?.messages, body?.context);
    if (!messages.some((message) => message.role === 'user')) {
      return json({ error: 'Escreva uma pergunta para o Obreiro IA.' }, 400);
    }

    const latestQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    let bibleMatch: BibleQuoteCandidate | null = null;
    try {
      bibleMatch = await findBibleQuoteInDatabase(admin, latestQuestion);
    } catch (error) {
      console.warn('Bible database lookup failed; using bundled Bible fallback.', error instanceof Error ? error.message : 'unknown_error');
    }
    bibleMatch ??= findBibleQuote(latestQuestion, bundledBibleVerses);
    if (bibleMatch) return json({ text: formatBibleQuoteAnswer(bibleMatch), source: 'bible_database' });

    if (!isCloudflareWorkersAiConfigured()) {
      return json({ error: 'O provedor de IA ainda não foi configurado no servidor.' }, 503);
    }

    const text = await retryWithBackoff(
      () => generateWithCloudflareWorkersAi(messages),
      { attempts: 3, initialDelayMs: 600 },
    );

    const nextUsage = {
      ...usage,
      date: today,
      imagesCount: Number(usage.imagesCount ?? 0),
      podcastsCount: Number(usage.podcastsCount ?? 0),
      analysisCount: Number(usage.analysisCount ?? 0),
      chatCount: chatCount + 1,
    };
    const { error: usageError } = await admin
      .from('profiles')
      .update({ usage_today: nextUsage })
      .eq('id', user.id);
    if (usageError) throw new Error('AI usage could not be recorded.');

    return json({ text, remaining: Math.max(0, plan.limits.chat - nextUsage.chatCount) });
  } catch (error) {
    console.error('Cloudflare AI chat failed:', error instanceof Error ? error.message : 'unknown_error');
    return json({ error: 'Não foi possível consultar o Obreiro IA agora. Tente novamente.' }, 502);
  }
}

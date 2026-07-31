import { createHash, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { DAILY_BREAD } from '../../../../constants';
import { generateDailyDevotional } from '../../../../services/pastorAgent';
import { normalizeVerseReference } from '../../../../services/devotionalResolverCore';

export const dynamic = 'force-dynamic';

type DevotionalSource = 'ai' | 'legacy' | 'curated';

interface DevotionalContentRow {
  id: string;
  title: string;
  verse_reference: string;
  verse_text: string;
  content: string;
  prayer: string;
  source: DevotionalSource;
  created_at: string;
}

interface DevotionalDraft {
  title: string;
  verseReference: string;
  verseText: string;
  content: string;
  prayer: string;
}

const MANaus_TIME_ZONE = 'America/Manaus';
const REFRESH_RESERVATION_MINUTES = 10;

const getManausDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: MANaus_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing.');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const readBearerToken = (request: NextRequest) => {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

const normalizeDraft = (raw: any): DevotionalDraft | null => {
  const draft = {
    title: String(raw?.title ?? '').trim(),
    verseReference: String(raw?.verseReference ?? raw?.reference ?? '').trim(),
    verseText: String(raw?.verseText ?? raw?.verse ?? '').trim(),
    content: String(raw?.content ?? raw?.text ?? '').trim(),
    prayer: String(raw?.prayer ?? '').trim(),
  };
  if (Object.values(draft).some((value) => value.length === 0)) return null;
  if (draft.content.length < 180 || draft.prayer.length < 30) return null;
  return draft;
};

const contentHash = (draft: DevotionalDraft) => createHash('sha256')
  .update([
    normalizeVerseReference(draft.verseReference),
    draft.verseText.trim().toLowerCase(),
    draft.content.trim().toLowerCase(),
    draft.prayer.trim().toLowerCase(),
  ].join('|'))
  .digest('hex');

const persistContent = async (
  admin: SupabaseClient,
  draft: DevotionalDraft,
  source: DevotionalSource,
  sourceDate: string,
) => {
  const { data, error } = await admin
    .from('daily_devotional_content')
    .upsert({
      content_hash: contentHash(draft),
      title: draft.title,
      verse_reference: draft.verseReference,
      verse_text: draft.verseText,
      content: draft.content,
      prayer: draft.prayer,
      source,
      source_date: sourceDate,
    }, { onConflict: 'content_hash' })
    .select('*')
    .single();
  if (error) throw error;
  return data as DevotionalContentRow;
};

const generateUniqueContent = async (
  admin: SupabaseClient,
  date: string,
  excludedReferences: string[],
) => {
  const excluded = new Set(excludedReferences.map(normalizeVerseReference));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generated = normalizeDraft(await generateDailyDevotional(true, 'gemini', {
      excludedVerseReferences: Array.from(excludedReferences),
    }));
    if (!generated || excluded.has(normalizeVerseReference(generated.verseReference))) continue;
    return persistContent(admin, generated, 'ai', date);
  }
  throw new Error('Não foi possível gerar um conteúdo bíblico inédito agora.');
};

const getContent = async (admin: SupabaseClient, contentId: string) => {
  const { data, error } = await admin
    .from('daily_devotional_content')
    .select('*')
    .eq('id', contentId)
    .single();
  if (error) throw error;
  return data as DevotionalContentRow;
};

const getCanonicalForDate = async (admin: SupabaseClient, date: string) => {
  const { data: scheduled } = await admin
    .from('daily_devotional_schedule')
    .select('content_id')
    .eq('devotional_date', date)
    .maybeSingle();
  if (scheduled?.content_id) return getContent(admin, scheduled.content_id);

  const recentStart = new Date(`${date}T12:00:00-04:00`);
  recentStart.setDate(recentStart.getDate() - 60);
  const { data: recentSchedules } = await admin
    .from('daily_devotional_schedule')
    .select('content_id')
    .gte('devotional_date', recentStart.toISOString().slice(0, 10));
  const recentIds = new Set((recentSchedules ?? []).map((item: any) => item.content_id));
  const { data: catalog } = await admin
    .from('daily_devotional_content')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(500);

  let candidate = (catalog as DevotionalContentRow[] | null)?.find((item) => !recentIds.has(item.id));
  if (!candidate) {
    const excluded = (catalog as DevotionalContentRow[] | null)?.map((item) => item.verse_reference) ?? [];
    try {
      candidate = await generateUniqueContent(admin, date, excluded);
    } catch {
      const safeFallback = normalizeDraft(DAILY_BREAD);
      if (!safeFallback) throw new Error('Conteúdo padrão inválido.');
      candidate = await persistContent(admin, safeFallback, 'curated', date);
    }
  }

  const { error: insertError } = await admin.from('daily_devotional_schedule').insert({
    devotional_date: date,
    content_id: candidate.id,
  });
  if (!insertError) return candidate;
  if (insertError.code !== '23505') throw insertError;

  const { data: winner, error: winnerError } = await admin
    .from('daily_devotional_schedule')
    .select('content_id')
    .eq('devotional_date', date)
    .single();
  if (winnerError) throw winnerError;
  return getContent(admin, winner.content_id);
};

const getSeenContent = async (admin: SupabaseClient, userId: string) => {
  const { data, error } = await admin
    .from('user_daily_devotional_views')
    .select('content_id, daily_devotional_content(verse_reference)')
    .eq('user_id', userId)
    .order('first_seen_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  const rows = data ?? [];
  const legacyReferences: string[] = [];
  const { data: legacyHistory } = await admin
    .from('user_devotionals')
    .select('content_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (legacyHistory?.length) {
    const legacyIds = legacyHistory.map((item: any) => String(item.content_id ?? ''));
    const dates = legacyIds
      .map((id) => id.match(/^daily:(\d{4}-\d{2}-\d{2})(?::|$)/)?.[1] ?? (/^\d{4}-\d{2}-\d{2}$/.test(id) ? id : null))
      .filter((value): value is string => Boolean(value));
    const uuids = legacyIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    const legacyRows: any[] = [];
    if (dates.length) {
      const { data: byDate } = await admin.from('daily_devotionals').select('*').in('date', dates);
      if (byDate) legacyRows.push(...byDate);
    }
    if (uuids.length) {
      const { data: byId } = await admin.from('daily_devotionals').select('*').in('id', uuids);
      if (byId) legacyRows.push(...byId);
    }
    legacyReferences.push(...legacyRows
      .map((item) => item.verse_reference ?? item.verseReference ?? item.reference)
      .filter(Boolean));
  }
  return {
    ids: new Set(rows.map((item: any) => item.content_id)),
    references: [...rows
      .map((item: any) => item.daily_devotional_content?.verse_reference)
      .filter(Boolean), ...legacyReferences] as string[],
  };
};

const recordView = async (admin: SupabaseClient, userId: string, contentId: string) => {
  const { error } = await admin.from('user_daily_devotional_views').upsert({
    user_id: userId,
    content_id: contentId,
  }, { onConflict: 'user_id,content_id', ignoreDuplicates: true });
  if (error) throw error;
};

const getOrAssignUserContent = async (
  admin: SupabaseClient,
  userId: string,
  date: string,
  canonical: DevotionalContentRow,
) => {
  const { data: current, error: currentError } = await admin
    .from('user_daily_devotional_state')
    .select('*')
    .eq('user_id', userId)
    .eq('devotional_date', date)
    .maybeSingle();
  if (currentError) throw currentError;
  if (current?.content_id) {
    await recordView(admin, userId, current.content_id);
    return { state: current, content: await getContent(admin, current.content_id) };
  }

  const seen = await getSeenContent(admin, userId);
  let content = seen.ids.has(canonical.id) ? null : canonical;
  if (!content) {
    const { data: catalog, error: catalogError } = await admin
      .from('daily_devotional_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (catalogError) throw catalogError;
    content = (catalog as DevotionalContentRow[] | null)?.find((item) => !seen.ids.has(item.id)) ?? null;
  }
  content = content ?? await generateUniqueContent(admin, date, seen.references);

  const { data: inserted, error: insertError } = await admin
    .from('user_daily_devotional_state')
    .insert({ user_id: userId, devotional_date: date, content_id: content.id })
    .select('*')
    .single();
  if (insertError?.code === '23505') {
    const { data: winner, error: winnerError } = await admin
      .from('user_daily_devotional_state')
      .select('*')
      .eq('user_id', userId)
      .eq('devotional_date', date)
      .single();
    if (winnerError) throw winnerError;
    await recordView(admin, userId, winner.content_id);
    return { state: winner, content: await getContent(admin, winner.content_id) };
  }
  if (insertError) throw insertError;
  await recordView(admin, userId, content.id);
  return { state: inserted, content };
};

const toResponse = (
  row: DevotionalContentRow,
  date: string,
  options?: { refreshAvailable?: boolean; refreshUsedAt?: string | null; personalized?: boolean },
) => ({
  id: `daily:${date}:${row.id}`,
  contentId: row.id,
  date,
  title: row.title,
  verseReference: row.verse_reference,
  verseText: row.verse_text,
  content: row.content,
  prayer: row.prayer,
  source: row.source === 'ai' ? 'generated' : 'catalog',
  refreshAvailable: options?.refreshAvailable ?? false,
  refreshUsedAt: options?.refreshUsedAt ?? null,
  personalized: options?.personalized ?? false,
});

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});

const safeErrorDetails = (error: unknown) => {
  if (error instanceof Error) return { name: error.name, message: error.message };
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    return {
      code: candidate.code,
      message: candidate.message,
      details: candidate.details,
      hint: candidate.hint,
    };
  }
  return { message: String(error) };
};

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient();
    const date = getManausDate();
    const canonical = await getCanonicalForDate(admin, date);
    const token = readBearerToken(request);
    if (!token) return json(toResponse(canonical, date));

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError) {
      console.warn('Daily devotional auth lookup failed; serving canonical content:', safeErrorDetails(authError));
      return json(toResponse(canonical, date));
    }
    if (!authData.user) return json(toResponse(canonical, date));

    try {
      const assigned = await getOrAssignUserContent(admin, authData.user.id, date, canonical);
      return json(toResponse(assigned.content, date, {
        refreshAvailable: !assigned.state.refresh_used_at,
        refreshUsedAt: assigned.state.refresh_used_at,
        personalized: assigned.content.id !== canonical.id,
      }));
    } catch (error) {
      // Personalização é um aprimoramento: sua indisponibilidade não pode bloquear
      // a leitura do conteúdo canônico que já foi resolvido com segurança.
      console.error('Daily devotional personalization failed; serving canonical content:', safeErrorDetails(error));
      return json(toResponse(canonical, date));
    }
  } catch (error) {
    console.error('Daily devotional GET failed:', safeErrorDetails(error));
    return json({
      error: 'Não foi possível preparar o Pão Diário agora.',
      code: 'DAILY_DEVOTIONAL_UNAVAILABLE',
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = getAdminClient();
  const token = readBearerToken(request);
  if (!token) return json({ error: 'Entre na sua conta para atualizar o Pão Diário.', code: 'AUTH_REQUIRED' }, 401);

  const { data: authData } = await admin.auth.getUser(token);
  const user = authData.user;
  if (!user) return json({ error: 'Sua sessão expirou. Entre novamente.', code: 'AUTH_REQUIRED' }, 401);

  const date = getManausDate();
  let reservationId: string | null = null;
  try {
    const canonical = await getCanonicalForDate(admin, date);
    await getOrAssignUserContent(admin, user.id, date, canonical);

    reservationId = randomUUID();
    const staleBefore = new Date(Date.now() - REFRESH_RESERVATION_MINUTES * 60_000).toISOString();
    const { data: reserved, error: reserveError } = await admin
      .from('user_daily_devotional_state')
      .update({
        refresh_reservation_id: reservationId,
        refresh_reserved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('devotional_date', date)
      .is('refresh_used_at', null)
      .or(`refresh_reservation_id.is.null,refresh_reserved_at.lt.${staleBefore}`)
      .select('user_id')
      .maybeSingle();
    if (reserveError) throw reserveError;
    if (!reserved) {
      return json({
        error: 'Você já usou sua atualização de hoje. Amanhã haverá uma nova opção.',
        code: 'DAILY_REFRESH_USED',
      }, 409);
    }

    const seen = await getSeenContent(admin, user.id);
    const content = await generateUniqueContent(admin, date, seen.references);
    const usedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from('user_daily_devotional_state')
      .update({
        content_id: content.id,
        refresh_used_at: usedAt,
        refresh_reservation_id: null,
        refresh_reserved_at: null,
        updated_at: usedAt,
      })
      .eq('user_id', user.id)
      .eq('devotional_date', date)
      .eq('refresh_reservation_id', reservationId)
      .select('content_id')
      .single();
    if (updateError || !updated) throw updateError ?? new Error('Refresh reservation was lost.');
    await recordView(admin, user.id, content.id);

    return json(toResponse(content, date, {
      refreshAvailable: false,
      refreshUsedAt: usedAt,
      personalized: true,
    }));
  } catch (error) {
    if (reservationId) {
      await admin
        .from('user_daily_devotional_state')
        .update({ refresh_reservation_id: null, refresh_reserved_at: null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('devotional_date', date)
        .eq('refresh_reservation_id', reservationId);
    }
    console.error('Daily devotional POST failed:', error);
    return json({ error: 'Não foi possível gerar um novo Pão Diário. Sua atualização não foi consumida.' }, 500);
  }
}

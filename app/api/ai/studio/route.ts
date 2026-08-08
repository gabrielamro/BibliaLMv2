import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { generateAIOnePage } from '../../../../services/pastorAgent';
import { retryWithBackoff } from '../../../../services/retryWithBackoff';
import { canAccessStudioAi } from '../../../../services/studioAiAccessPolicy';

export const dynamic = 'force-dynamic';

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

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});

const readFeatureMatrix = (value: unknown): Record<string, { aiSermonBuilder?: boolean }> | undefined => {
  const settings = typeof value === 'string'
    ? (() => {
      try { return JSON.parse(value); } catch { return null; }
    })()
    : value;
  if (!settings || typeof settings !== 'object') return undefined;

  const matrix = (settings as { featuresMatrix?: unknown }).featuresMatrix;
  return matrix && typeof matrix === 'object'
    ? matrix as Record<string, { aiSermonBuilder?: boolean }>
    : undefined;
};

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
        .select('subscription_tier, profile_type')
        .eq('id', user.id)
        .maybeSingle(),
      admin
        .from('settings')
        .select('value')
        .eq('key', 'global')
        .maybeSingle(),
    ]);
    const tier = String(profile?.subscription_tier ?? 'free');
    const profileType = String(profile?.profile_type ?? 'user');
    if (!canAccessStudioAi({
      subscriptionTier: tier,
      profileType,
      featuresMatrix: readFeatureMatrix(settings?.value),
    })) {
      return json({ error: 'Seu plano atual não inclui a criação completa com IA.' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? '').trim().slice(0, 5000);
    const authorName = String(body?.authorName ?? '').trim().slice(0, 120);
    if (prompt.length < 12) return json({ error: 'Descreva melhor o estudo que deseja criar.' }, 400);

    const result = await retryWithBackoff(
      () => generateAIOnePage(prompt, authorName || undefined),
      { attempts: 3, initialDelayMs: 700 },
    );
    if (!result || !Array.isArray(result.blocks) || result.blocks.length === 0) {
      return json({ error: 'A IA retornou um documento incompleto.' }, 502);
    }
    return json(result);
  } catch (error) {
    console.error('Studio AI generation failed:', error instanceof Error ? error.message : 'unknown_error');
    return json({ error: 'Não foi possível gerar o estudo agora. Tente novamente.' }, 500);
  }
}

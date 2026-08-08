import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import {
  canAccessAiFeature,
  isAiFeatureKey,
  type AiFeaturesMatrix,
} from '../../../../services/aiFeatureAccessPolicy';
import { callAi } from '../../../../services/geminiService';
import { retryWithBackoff } from '../../../../services/retryWithBackoff';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing.');
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
};

const readObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
};

const readFeatureMatrix = (value: unknown): AiFeaturesMatrix | undefined => {
  const matrix = readObject(value).featuresMatrix;
  return matrix && typeof matrix === 'object' ? matrix as AiFeaturesMatrix : undefined;
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token) return json({ error: 'Entre na sua conta para usar os recursos de IA.' }, 401);

    const admin = getAdminClient();
    const { data: authData } = await admin.auth.getUser(token);
    if (!authData.user) return json({ error: 'Sua sessão expirou. Entre novamente.' }, 401);

    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? '').trim().slice(0, 12_000);
    const systemInstruction = String(body?.systemInstruction ?? '').trim().slice(0, 4_000) || undefined;
    const responseFormat = body?.responseFormat === 'json' ? 'json' : 'text';
    const feature = isAiFeatureKey(body?.feature) ? body.feature : 'aiChatAccess';
    if (!prompt) return json({ error: 'Informe o conteúdo que deseja gerar.' }, 400);

    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin.from('profiles').select('subscription_tier, profile_type').eq('id', authData.user.id).maybeSingle(),
      admin.from('settings').select('value').eq('key', 'global').maybeSingle(),
    ]);
    if (!canAccessAiFeature({
      subscriptionTier: profile?.subscription_tier,
      profileType: profile?.profile_type,
      feature,
      featuresMatrix: readFeatureMatrix(settings?.value),
    })) {
      return json({ error: 'Seu plano atual não inclui este recurso de IA.' }, 403);
    }

    const text = await retryWithBackoff(
      () => callAi(prompt, systemInstruction, responseFormat, feature),
      { attempts: 2, initialDelayMs: 600 },
    );
    return json({ text });
  } catch (error) {
    console.error('AI text generation failed:', error instanceof Error ? error.message : 'unknown_error');
    return json({ error: 'Não foi possível gerar o conteúdo agora. Tente novamente.' }, 502);
  }
}

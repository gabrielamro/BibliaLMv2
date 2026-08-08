import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { SUBSCRIPTION_PLANS } from '../../../../constants';
import { canAccessAiFeature, type AiFeaturesMatrix } from '../../../../services/aiFeatureAccessPolicy';
import { generateAiImageOnServer } from '../../../../services/serverImageGenerationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});

const readObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
};

const getManausDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token) return json({ error: 'Entre na sua conta para gerar imagens.' }, 401);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing.');
    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: authData } = await admin.auth.getUser(token);
    if (!authData.user) return json({ error: 'Sua sessão expirou. Entre novamente.' }, 401);

    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin.from('profiles').select('subscription_tier, profile_type, usage_today').eq('id', authData.user.id).maybeSingle(),
      admin.from('settings').select('value').eq('key', 'global').maybeSingle(),
    ]);
    const settingsObject = readObject(settings?.value);
    const featuresMatrix = settingsObject.featuresMatrix && typeof settingsObject.featuresMatrix === 'object'
      ? settingsObject.featuresMatrix as AiFeaturesMatrix
      : undefined;
    const tier = String(profile?.subscription_tier ?? 'free');
    if (!canAccessAiFeature({
      subscriptionTier: tier,
      profileType: profile?.profile_type,
      feature: 'aiImageGen',
      featuresMatrix,
    })) return json({ error: 'Seu plano atual não inclui geração de imagens.' }, 403);

    const plan = SUBSCRIPTION_PLANS.find((candidate) => candidate.id === tier) ?? SUBSCRIPTION_PLANS[0];
    const today = getManausDate();
    const storedUsage = readObject(profile?.usage_today);
    const usage = storedUsage.date === today ? storedUsage : {};
    const imagesCount = Number(usage.imagesCount ?? 0);
    if (imagesCount >= plan.limits.images) return json({ error: 'Sua cota diária de imagens foi atingida.' }, 429);

    const body = await request.json().catch(() => ({}));
    const text = String(body?.text ?? '').trim().slice(0, 1200);
    const reference = String(body?.reference ?? '').trim().slice(0, 200);
    const style = String(body?.style ?? 'cinematic').trim().slice(0, 120);
    if (!text) return json({ error: 'Descreva a imagem que deseja gerar.' }, 400);

    const prompt = `High quality ${style} Christian sacred art inspired by: "${text}"${reference ? ` (${reference})` : ''}. Spiritual, reverent, cinematic lighting, detailed masterpiece. No text, letters, words, captions, frames, borders, logos or watermarks. Avoid red backgrounds. Focus only on the visual subject.`;
    const image = await generateAiImageOnServer(prompt);
    const nextUsage = {
      ...usage,
      date: today,
      imagesCount: imagesCount + 1,
      podcastsCount: Number(usage.podcastsCount ?? 0),
      analysisCount: Number(usage.analysisCount ?? 0),
      chatCount: Number(usage.chatCount ?? 0),
    };
    const { error: updateError } = await admin.from('profiles').update({ usage_today: nextUsage }).eq('id', authData.user.id);
    if (updateError) throw new Error('AI image usage could not be recorded.');
    return json({ ...image, remaining: Math.max(0, plan.limits.images - nextUsage.imagesCount) });
  } catch (error) {
    console.error('AI image generation failed:', error instanceof Error ? error.message : 'unknown_error');
    return json({ error: 'Não foi possível gerar a imagem agora. Tente novamente.' }, 502);
  }
}

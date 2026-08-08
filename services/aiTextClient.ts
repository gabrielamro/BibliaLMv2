import type { AiFeatureKey } from './aiFeatureAccessPolicy';
import { supabase } from './supabase';

export interface AiTextRequest {
  prompt: string;
  systemInstruction?: string;
  responseFormat?: 'json' | 'text';
  feature?: AiFeatureKey;
}

export const generateTextWithAi = async (request: AiTextRequest): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Entre na sua conta para usar os recursos de IA.');

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível gerar o conteúdo agora.');
  const text = String(payload?.text ?? '').trim();
  if (!text) throw new Error('A IA retornou uma resposta vazia.');
  return text;
};

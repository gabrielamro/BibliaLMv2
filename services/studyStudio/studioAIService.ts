import { supabase } from '../supabase';

interface StudioAIBuildInput {
  prompt: string;
  authorName?: string;
}

export interface StudioAIBuildResult {
  meta: {
    title?: string;
    description?: string;
  };
  slug?: string;
  blocks: Array<Record<string, any>>;
}

const validateResult = (value: unknown): StudioAIBuildResult => {
  if (!value || typeof value !== 'object') throw new Error('A IA retornou um documento inválido.');
  const candidate = value as StudioAIBuildResult;
  if (!Array.isArray(candidate.blocks) || candidate.blocks.length === 0) {
    throw new Error('A IA não retornou blocos editáveis.');
  }
  for (const block of candidate.blocks) {
    if (!block || typeof block.type !== 'string' || typeof block.data !== 'object') {
      throw new Error('A IA retornou um bloco fora do contrato do Estúdio.');
    }
  }
  return {
    ...candidate,
    meta: candidate.meta && typeof candidate.meta === 'object' ? candidate.meta : {},
  };
};

const generate = async (input: StudioAIBuildInput): Promise<StudioAIBuildResult> => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Entre na sua conta para usar o Obreiro IA.');

  const response = await fetch('/api/ai/studio', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Não foi possível gerar o estudo agora.');
  }
  return validateResult(payload);
};

export const studioAIService = {
  // A repetição acontece uma única vez no servidor para evitar multiplicar
  // chamadas pagas quando o provedor estiver indisponível.
  generateOnePage: (input: StudioAIBuildInput) => generate(input),
};

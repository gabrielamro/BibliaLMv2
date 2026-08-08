export type CloudflareAiRole = 'system' | 'user' | 'assistant';

export interface CloudflareAiMessage {
  role: CloudflareAiRole;
  content: string;
}

interface CloudflareChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
  errors?: Array<{ message?: string }>;
}

interface CloudflareImageResponse {
  result?: { image?: string };
  image?: string;
  errors?: Array<{ message?: string }>;
}

export const DEFAULT_CLOUDFLARE_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
export const DEFAULT_CLOUDFLARE_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';

const getConfiguration = () => ({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN?.trim() ?? '',
  model: process.env.CLOUDFLARE_AI_MODEL?.trim() || DEFAULT_CLOUDFLARE_AI_MODEL,
  imageModel: process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || DEFAULT_CLOUDFLARE_IMAGE_MODEL,
});

export const isCloudflareWorkersAiConfigured = () => {
  const { accountId, apiToken } = getConfiguration();
  return Boolean(accountId && apiToken);
};

const encodeModelPath = (model: string) => model.split('/').map(encodeURIComponent).join('/');
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

export const generateImageWithCloudflareWorkersAi = async (
  prompt: string,
  options: { steps?: number; seed?: number } = {},
): Promise<{ mimeType: string; data: string }> => {
  const { accountId, apiToken, imageModel } = getConfiguration();
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Workers AI server configuration is missing.');
  }
  if (!imageModel.startsWith('@cf/')) throw new Error('Invalid Cloudflare Workers AI image model.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeModelPath(imageModel)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim().slice(0, 2048),
          steps: Math.min(Math.max(options.steps ?? 4, 1), 8),
          ...(Number.isInteger(options.seed) ? { seed: options.seed } : {}),
        }),
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    const contentType = response.headers.get('content-type') ?? '';
    if (response.ok && contentType.startsWith('image/')) {
      return { mimeType: contentType.split(';')[0], data: arrayBufferToBase64(await response.arrayBuffer()) };
    }

    const payload = await response.json().catch(() => ({})) as CloudflareImageResponse;
    if (!response.ok) {
      const providerMessage = payload.errors?.[0]?.message?.slice(0, 240);
      throw new Error(`Cloudflare Workers AI image request failed (${response.status})${providerMessage ? `: ${providerMessage}` : '.'}`);
    }
    const data = payload.result?.image ?? payload.image;
    if (!data) throw new Error('Cloudflare Workers AI returned an empty image.');
    return { mimeType: 'image/jpeg', data };
  } finally {
    clearTimeout(timeout);
  }
};

export const generateWithCloudflareWorkersAi = async (
  messages: CloudflareAiMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> => {
  const { accountId, apiToken, model } = getConfiguration();
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Workers AI server configuration is missing.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: Math.min(Math.max(options.maxTokens ?? 900, 64), 2048),
          temperature: Math.min(Math.max(options.temperature ?? 0.35, 0), 1),
        }),
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    const data = await response.json().catch(() => ({})) as CloudflareChatCompletion;
    if (!response.ok) {
      const providerMessage = data.errors?.[0]?.message?.slice(0, 240);
      throw new Error(`Cloudflare Workers AI request failed (${response.status})${providerMessage ? `: ${providerMessage}` : '.'}`);
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Cloudflare Workers AI returned an empty response.');
    return text;
  } finally {
    clearTimeout(timeout);
  }
};

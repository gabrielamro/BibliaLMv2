import { Modality } from '@google/genai';

import { getAiInstance } from './aiConfig';
import {
  generateImageWithCloudflareWorkersAi,
  isCloudflareWorkersAiConfigured,
} from './cloudflareAiService';
import { retryWithBackoff } from './retryWithBackoff';

const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

export interface GeneratedAiImage {
  mimeType: string;
  data: string;
  provider: 'cloudflare' | 'gemini';
}

export const generateAiImageOnServer = async (prompt: string): Promise<GeneratedAiImage> => {
  if (isCloudflareWorkersAiConfigured()) {
    try {
      const image = await retryWithBackoff(
        () => generateImageWithCloudflareWorkersAi(prompt),
        { attempts: 2, initialDelayMs: 700 },
      );
      return { ...image, provider: 'cloudflare' };
    } catch (error) {
      console.warn('Cloudflare Workers AI image generation failed; trying Gemini fallback:', error instanceof Error ? error.message : 'unknown_error');
    }
  }

  const response = await getAiInstance().models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseModalities: [Modality.IMAGE] },
  });
  const part = response.candidates?.[0]?.content?.parts?.find((candidate) => candidate.inlineData?.data);
  const data = part?.inlineData?.data;
  if (!data) throw new Error('No image provider returned image data.');
  return {
    mimeType: part.inlineData?.mimeType || 'image/png',
    data,
    provider: 'gemini',
  };
};

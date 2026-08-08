export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_HOSTS = new Set([
  'source.unsplash.com',
  'images.unsplash.com',
  'images.pexels.com',
  'nanobananaapi.ai',
  'api.nanobananaapi.ai',
]);

export const parseAllowedImageUrl = (value: string, base?: URL): URL | null => {
  try {
    const url = new URL(value, base);
    if (url.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
};

export const isImageContentType = (value: string | null) =>
  Boolean(value?.toLowerCase().split(';', 1)[0].trim().startsWith('image/'));

export const exceedsImageSizeLimit = (contentLength: string | null) => {
  if (!contentLength) return false;
  const size = Number(contentLength);
  return Number.isFinite(size) && size > MAX_IMAGE_BYTES;
};

export const readImageResponse = async (response: Response): Promise<Uint8Array> => {
  if (!response.body) return new Uint8Array(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error('image_too_large');
    }
    chunks.push(value);
  }

  const image = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    image.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return image;
};

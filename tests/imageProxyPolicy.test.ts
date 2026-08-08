import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_IMAGE_BYTES,
  exceedsImageSizeLimit,
  isImageContentType,
  parseAllowedImageUrl,
  readImageResponse,
} from '../app/api/image-proxy/imageProxyPolicy.ts';

test('accepts only HTTPS URLs from explicitly allowed image hosts', () => {
  assert.equal(parseAllowedImageUrl('https://images.unsplash.com/photo-1')?.hostname, 'images.unsplash.com');
  assert.equal(parseAllowedImageUrl('http://images.unsplash.com/photo-1'), null);
  assert.equal(parseAllowedImageUrl('https://images.unsplash.com.example.com/photo-1'), null);
  assert.equal(parseAllowedImageUrl('https://evilimages.unsplash.com/photo-1'), null);
});

test('recognizes image content types and enforces declared size limits', () => {
  assert.equal(isImageContentType('image/webp; charset=binary'), true);
  assert.equal(isImageContentType('text/html'), false);
  assert.equal(exceedsImageSizeLimit(String(MAX_IMAGE_BYTES + 1)), true);
  assert.equal(exceedsImageSizeLimit(String(MAX_IMAGE_BYTES)), false);
});

test('stops reading a response that grows beyond the image limit', async () => {
  const response = new Response(new Uint8Array(MAX_IMAGE_BYTES + 1));
  await assert.rejects(() => readImageResponse(response), /image_too_large/);
});

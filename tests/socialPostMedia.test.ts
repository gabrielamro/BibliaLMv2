import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getPostImageSource } from '../utils/socialPostMedia.ts';

test('uses legacy image field when present', () => {
  assert.equal(getPostImageSource({ image: 'data:image/webp;base64,abc', imageUrl: 'https://example.com/post.webp' }), 'data:image/webp;base64,abc');
});

test('uses Supabase imageUrl field when image is absent', () => {
  assert.equal(getPostImageSource({ imageUrl: 'https://example.com/post.webp' }), 'https://example.com/post.webp');
});

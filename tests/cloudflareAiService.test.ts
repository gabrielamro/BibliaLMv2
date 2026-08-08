import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CLOUDFLARE_AI_MODEL,
  DEFAULT_CLOUDFLARE_IMAGE_MODEL,
  isCloudflareWorkersAiConfigured,
} from '../services/cloudflareAiService.ts';
import { canAccessAiChat } from '../services/aiChatAccessPolicy.ts';

test('uses a stable Workers AI text model by default', () => {
  assert.equal(DEFAULT_CLOUDFLARE_AI_MODEL, '@cf/meta/llama-3.1-8b-instruct-fast');
});

test('uses FLUX Schnell as the default Workers AI image model', () => {
  assert.equal(DEFAULT_CLOUDFLARE_IMAGE_MODEL, '@cf/black-forest-labs/flux-1-schnell');
});

test('requires both Cloudflare credentials', () => {
  const previousAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const previousToken = process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_API_TOKEN;
  assert.equal(isCloudflareWorkersAiConfigured(), false);

  process.env.CLOUDFLARE_ACCOUNT_ID = 'account';
  assert.equal(isCloudflareWorkersAiConfigured(), false);
  process.env.CLOUDFLARE_API_TOKEN = 'token';
  assert.equal(isCloudflareWorkersAiConfigured(), true);

  if (previousAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccount;
  if (previousToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = previousToken;
});

test('preserves the existing chat feature policy', () => {
  assert.equal(canAccessAiChat({ subscriptionTier: 'free' }), true);
  assert.equal(canAccessAiChat({ subscriptionTier: 'gold' }), true);
  assert.equal(canAccessAiChat({ subscriptionTier: 'bronze' }), false);
  assert.equal(canAccessAiChat({
    subscriptionTier: 'bronze',
    featuresMatrix: { bronze: { aiChatAccess: true } },
  }), true);
});

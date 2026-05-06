import test from 'node:test';
import * as assert from 'node:assert/strict';

import { shouldRetryFeedWithoutDestination } from '../utils/kingdomFeedFallback.ts';

test('retries feed query when legacy posts table has no destination column', () => {
  assert.equal(shouldRetryFeedWithoutDestination({
    code: '42703',
    message: 'column posts.destination does not exist',
  }), true);
});

test('does not retry feed query for unrelated Supabase errors', () => {
  assert.equal(shouldRetryFeedWithoutDestination({
    code: '42501',
    message: 'new row violates row-level security policy',
  }), false);
});

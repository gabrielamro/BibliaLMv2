import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getPublicProfileTabs } from '../utils/profileTabs.ts';

test('owner profile tabs do not include account settings', () => {
  assert.deepEqual(
    getPublicProfileTabs({ isOwner: true }).map((tab) => tab.id),
    ['overview', 'studies', 'plans'],
  );
});

test('visitor profile tabs keep the same public sections', () => {
  assert.deepEqual(
    getPublicProfileTabs({ isOwner: false }).map((tab) => tab.id),
    ['overview', 'studies', 'plans'],
  );
});

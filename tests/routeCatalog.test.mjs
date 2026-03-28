import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appFilePathToRoute,
  buildCaptureEntries,
  classifyRoute,
  discoverAppRoutes,
  materializeRoute,
  screenshotOutputPath,
  slugifyRoute,
} from '../scripts/lib/routeCatalog.mjs';

test('appFilePathToRoute converts page paths into app routes', () => {
  assert.equal(appFilePathToRoute('app/page.tsx'), '/');
  assert.equal(appFilePathToRoute('app/intro/page.tsx'), '/intro');
  assert.equal(appFilePathToRoute('app/social/u/[username]/page.tsx'), '/social/u/[username]');
});

test('classifyRoute marks dynamic and auth-sensitive routes', () => {
  assert.deepEqual(classifyRoute('/intro'), {
    isDynamic: false,
    isRootProfile: false,
    requiresAuth: false,
  });

  assert.deepEqual(classifyRoute('/u/[username]'), {
    isDynamic: true,
    isRootProfile: false,
    requiresAuth: false,
  });

  assert.deepEqual(classifyRoute('/workspace'), {
    isDynamic: false,
    isRootProfile: false,
    requiresAuth: true,
  });
});

test('materializeRoute replaces dynamic params with fallback values', () => {
  const fallbackParams = {
    username: 'pastor',
    churchSlug: 'igreja-central',
  };

  assert.equal(materializeRoute('/u/[username]', fallbackParams), '/u/pastor');
  assert.equal(materializeRoute('/igreja/[churchSlug]', fallbackParams), '/igreja/igreja-central');
  assert.equal(materializeRoute('/intro', fallbackParams), '/intro');
});

test('slugifyRoute creates stable screenshot filenames', () => {
  assert.equal(slugifyRoute('/'), 'home');
  assert.equal(slugifyRoute('/social/u/pastor'), 'social-u-pastor');
  assert.equal(slugifyRoute('/estudo/modulo/abc123'), 'estudo-modulo-abc123');
});

test('discoverAppRoutes maps app pages into sorted route entries', () => {
  const entries = discoverAppRoutes([
    'app/page.tsx',
    'app/social/u/[username]/page.tsx',
    'app/workspace/page.tsx',
  ]);

  assert.deepEqual(entries, [
    {
      filePath: 'app/page.tsx',
      route: '/',
      isDynamic: false,
      isRootProfile: false,
      requiresAuth: false,
    },
    {
      filePath: 'app/social/u/[username]/page.tsx',
      route: '/social/u/[username]',
      isDynamic: true,
      isRootProfile: false,
      requiresAuth: false,
    },
    {
      filePath: 'app/workspace/page.tsx',
      route: '/workspace',
      isDynamic: false,
      isRootProfile: false,
      requiresAuth: true,
    },
  ]);
});

test('buildCaptureEntries materializes route params and output file names', () => {
  const entries = buildCaptureEntries(
    [
      {
        filePath: 'app/social/u/[username]/page.tsx',
        route: '/social/u/[username]',
        isDynamic: true,
        isRootProfile: false,
        requiresAuth: false,
      },
      {
        filePath: 'app/workspace/page.tsx',
        route: '/workspace',
        isDynamic: false,
        isRootProfile: false,
        requiresAuth: true,
      },
    ],
    {
      username: 'pastor',
    },
    'docs/mockups/catalog'
  );

  assert.deepEqual(entries, [
    {
      filePath: 'app/social/u/[username]/page.tsx',
      route: '/social/u/[username]',
      materializedRoute: '/social/u/pastor',
      screenshotPath: screenshotOutputPath('docs/mockups/catalog', '/social/u/pastor'),
      isDynamic: true,
      isRootProfile: false,
      requiresAuth: false,
    },
    {
      filePath: 'app/workspace/page.tsx',
      route: '/workspace',
      materializedRoute: '/workspace',
      screenshotPath: screenshotOutputPath('docs/mockups/catalog', '/workspace'),
      isDynamic: false,
      isRootProfile: false,
      requiresAuth: true,
    },
  ]);
});

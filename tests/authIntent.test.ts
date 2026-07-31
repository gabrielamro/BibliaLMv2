import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  consumePendingCultoReaction,
  getSafeAuthReturnPath,
  readAuthReturnPath,
  readPendingCultoReaction,
  storeAuthReturnPath,
  storePendingCultoReaction,
} from '../utils/authIntent.ts';

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

const withBrowserSession = (callback: () => void) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { sessionStorage: new MemoryStorage() },
  });

  try {
    callback();
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
};

test('keeps a safe culto route and rejects external auth redirects', () => {
  assert.equal(
    getSafeAuthReturnPath('/culto/qa-qa-service-no-team?invite=abc#timeline'),
    '/culto/qa-qa-service-no-team?invite=abc#timeline',
  );
  assert.equal(getSafeAuthReturnPath('https://example.com/phishing'), '/');
  assert.equal(getSafeAuthReturnPath('//example.com/phishing'), '/');
  assert.equal(getSafeAuthReturnPath('/login'), '/');
});

test('persists the return route across an OAuth page reload', () => {
  withBrowserSession(() => {
    storeAuthReturnPath('/culto/culto-teste?checkin=1');
    assert.equal(readAuthReturnPath(), '/culto/culto-teste?checkin=1');

    storeAuthReturnPath(null);
    assert.equal(readAuthReturnPath(), null);
  });
});

test('consumes a pending reaction only in its originating culto', () => {
  withBrowserSession(() => {
    storePendingCultoReaction({
      serviceSlug: 'culto-teste',
      reactionType: 'amen',
    });

    assert.equal(consumePendingCultoReaction('outro-culto'), null);
    assert.equal(readPendingCultoReaction()?.reactionType, 'amen');
    assert.equal(consumePendingCultoReaction('culto-teste')?.reactionType, 'amen');
    assert.equal(readPendingCultoReaction(), null);
  });
});

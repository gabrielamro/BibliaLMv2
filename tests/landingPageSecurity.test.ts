import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const landingPage = readFileSync(resolve('views/LandingPage.tsx'), 'utf8');

test('landing title renders line breaks without interpreting configured HTML', () => {
  assert.doesNotMatch(landingPage, /dangerouslySetInnerHTML/);
  assert.match(landingPage, /config\.heroTitle\.split\('\\n'\)/);
});

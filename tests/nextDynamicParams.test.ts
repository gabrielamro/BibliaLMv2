import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public content route unwraps dynamic slug with useParams instead of params prop', () => {
  const source = readFileSync('app/l/[slug]/page.tsx', 'utf8');

  assert.match(source, /useParams/);
  assert.doesNotMatch(source, /function\s+PublicContentPage\s*\(\s*\{\s*params\s*\}/);
  assert.doesNotMatch(source, /const\s+\{\s*slug\s*\}\s*=\s*params/);
});

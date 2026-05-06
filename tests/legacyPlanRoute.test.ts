import test from 'node:test';
import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('legacy /plano/:planId route renders the public plan preview', () => {
  const routePath = 'app/plano/[planId]/page.tsx';

  assert.equal(existsSync(routePath), true);
  const source = readFileSync(routePath, 'utf8');
  assert.match(source, /PublicPlanPage/);
});

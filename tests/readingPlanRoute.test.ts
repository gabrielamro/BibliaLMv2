import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildReadingPlanUrl, parseReadingPlanSearchParams } from '../utils/readingPlanRoute.ts';

test('buildReadingPlanUrl creates a shareable reader URL with reading metadata', () => {
  const url = buildReadingPlanUrl({
    day: 12,
    sectionIndex: 1,
    scope: 'new_testament',
    planType: '365',
    startDate: '2026-06-15T00:00:00.000Z',
    chapter: 3,
  });

  assert.equal(
    url,
    '/plano/leitura?dia=12&secao=1&escopo=new_testament&tipo=365&inicio=2026-06-15T00%3A00%3A00.000Z&capitulo=3'
  );
});

test('parseReadingPlanSearchParams reads Portuguese route params', () => {
  const params = new URLSearchParams('dia=7&secao=2&escopo=old_testament&tipo=90&inicio=2026-06-01&capitulo=4');

  assert.deepEqual(parseReadingPlanSearchParams(params), {
    day: 7,
    sectionIndex: 2,
    scope: 'old_testament',
    planType: '90',
    startDate: '2026-06-01',
    chapter: 4,
  });
});

test('parseReadingPlanSearchParams accepts legacy English aliases and sanitizes invalid numbers', () => {
  const params = new URLSearchParams('day=-5&section=abc&scope=bad&type=365&chapter=0');

  assert.deepEqual(parseReadingPlanSearchParams(params), {
    day: 1,
    sectionIndex: 0,
    scope: undefined,
    planType: '365',
    startDate: undefined,
    chapter: 1,
  });
});

test('reader URL carries enough params to reconstruct the selected daily reading', () => {
  const url = buildReadingPlanUrl({
    day: 1,
    sectionIndex: 0,
    scope: 'new_testament',
    planType: '365',
    startDate: '2026-06-15T00:00:00.000Z',
  });
  const parsed = parseReadingPlanSearchParams(new URLSearchParams(url.split('?')[1]));

  assert.equal(parsed.sectionIndex, 0);
  assert.equal(parsed.day, 1);
  assert.equal(parsed.scope, 'new_testament');
  assert.equal(parsed.planType, '365');
  assert.equal(parsed.startDate, '2026-06-15T00:00:00.000Z');
});

import test from 'node:test';
import * as assert from 'node:assert/strict';

import { normalizeBiblialmInternalUrl } from '../utils/internalLinks.ts';
import { buildPlanSharePostContent, getPlanSharePath } from '../utils/planSharing.ts';
import { parseStudyShareContent } from '../utils/studySharePost.ts';

test('normalizes production biblialm links into internal routes for feed navigation', () => {
  assert.equal(
    normalizeBiblialmInternalUrl('https://biblialm.com.br/jornada/bd6a'),
    '/jornada/bd6a',
  );
  assert.equal(
    normalizeBiblialmInternalUrl('https://www.biblialm.com.br/jornada/bd6a?x=1#top'),
    '/jornada/bd6a?x=1#top',
  );
  assert.equal(normalizeBiblialmInternalUrl('/jornada/bd6a'), '/jornada/bd6a');
});

test('leaves external non-biblialm links untouched', () => {
  assert.equal(
    normalizeBiblialmInternalUrl('https://example.com/jornada/bd6a'),
    'https://example.com/jornada/bd6a',
  );
});

test('room share payload stores internal route so feed links do not leave the app', () => {
  const sharePath = getPlanSharePath('plan-1');
  const content = buildPlanSharePostContent(
    {
      id: 'plan-1',
      authorId: 'pastor-1',
      title: 'Vida de Oracao',
      description: '',
      privacyType: 'public',
    },
    sharePath,
  );

  assert.equal(sharePath, '/jornada/plan-1');
  assert.equal(parseStudyShareContent(content)?.studyUrl, '/jornada/plan-1');
});

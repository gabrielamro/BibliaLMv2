import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildStudyShareContent, parseStudyShareContent } from '../utils/studySharePost.ts';

test('serializes and parses study share content for feed posts', () => {
  const content = buildStudyShareContent({
    kind: 'study_share',
    studyId: 'study-1',
    studyTitle: 'A Graça no Evangelho de João',
    studyCoverUrl: 'https://example.com/capa.webp',
    studyUrl: '/v/study-1',
    description: 'Um estudo para fortalecer a fé.',
    sourceLabel: 'Estudo',
  });

  assert.deepEqual(parseStudyShareContent(content), {
    kind: 'study_share',
    studyId: 'study-1',
    studyTitle: 'A Graça no Evangelho de João',
    studyCoverUrl: 'https://example.com/capa.webp',
    studyUrl: '/v/study-1',
    description: 'Um estudo para fortalecer a fé.',
    sourceLabel: 'Estudo',
  });
});

test('returns null for normal post text', () => {
  assert.equal(parseStudyShareContent('Uma reflexao comum'), null);
});

import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildPlanSharePostContent } from '../utils/planSharing.ts';
import { parseStudyShareContent } from '../utils/studySharePost.ts';

test('plan sharing creates a room_share feed payload distinct from study_share', () => {
  const content = buildPlanSharePostContent(
    {
      id: 'room-1',
      authorId: 'pastor-1',
      title: 'Vida de Oracao',
      description: 'Uma sala sobre oracao.',
      privacyType: 'public',
      coverUrl: 'https://example.com/sala.webp',
    },
    'https://biblialm.com.br/jornada/room-1',
    'Entre nessa jornada.',
  );

  const parsed = parseStudyShareContent(content);

  assert.deepEqual(parsed, {
    kind: 'room_share',
    studyId: 'room-1',
    studyTitle: 'Vida de Oracao',
    studyCoverUrl: 'https://example.com/sala.webp',
    studyUrl: 'https://biblialm.com.br/jornada/room-1',
    description: 'Compartilhou uma sala no Reino: Vida de Oracao. Entre nessa jornada.',
    sourceLabel: 'Sala do Reino',
  });
  assert.doesNotMatch(content, /"kind":"study_share"/);
});

import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getEditDestinationForContent, getProfileStudyItems } from '../utils/contentEditing.ts';

test('study items always edit in criar-conteudo with contentId', () => {
  const study = {
    id: 'study-1',
    type: 'study',
    title: 'Estudo',
  };

  const destination = getEditDestinationForContent(study);

  assert.deepEqual(destination, {
    path: '/criar-conteudo?id=study-1',
    state: { contentId: 'study-1', studyData: study },
  });
});

test('plan items edit in criar-sala studio', () => {
  const plan = { id: 'plan-1', type: 'plan', title: 'Plano' };

  const destination = getEditDestinationForContent(plan);

  assert.deepEqual(destination, {
    path: '/criar-sala?id=plan-1',
    state: { planData: plan },
  });
});

test('note items do not produce a study editor route', () => {
  const destination = getEditDestinationForContent({
    id: 'note-1',
    type: 'note',
    title: 'Nota',
  });

  assert.equal(destination, null);
});

test('profile studies combine private and public standalone content for the owner', () => {
  const studies = getProfileStudyItems({
    studiesData: [
      {
        id: 'draft-1',
        title: 'Rascunho privado',
        status: 'draft',
        type: 'study',
        created_at: '2026-05-01T10:00:00.000Z',
      },
      {
        id: 'room-lesson',
        title: 'Aula de jornada',
        type: 'lesson',
        plan_id: 'plan-1',
        created_at: '2026-05-03T10:00:00.000Z',
      },
    ],
    publicStudiesData: [
      {
        id: 'published-1',
        status: 'published',
        type: 'article',
        meta: '{"title":"Publicado pelo studio","coverImage":"cover.jpg"}',
        blocks: '[{"type":"paragraph"}]',
        created_at: '2026-05-02T10:00:00.000Z',
      },
      {
        id: 'draft-1',
        title: 'Rascunho privado',
        status: 'published',
        type: 'study',
        created_at: '2026-05-01T10:00:00.000Z',
      },
    ],
    isOwner: true,
  });

  assert.deepEqual(studies.map((study) => study.id), ['published-1', 'draft-1']);
  assert.equal(studies[0].title, 'Publicado pelo studio');
  assert.equal(studies[0].coverUrl, 'cover.jpg');
  assert.deepEqual(studies[0].blocks, [{ type: 'paragraph' }]);
});

test('profile studies only expose published standalone content to visitors', () => {
  const studies = getProfileStudyItems({
    studiesData: [
      { id: 'draft-1', title: 'Rascunho', status: 'draft', type: 'study' },
      { id: 'old-published', title: 'Publicado antigo', status: 'published', type: 'study' },
    ],
    publicStudiesData: [
      { id: 'published-1', title: 'Publicado', status: 'published', type: 'article' },
      { id: 'room-1', title: 'Sala', status: 'published', type: 'plan' },
    ],
    isOwner: false,
  });

  assert.deepEqual(studies.map((study) => study.id), ['published-1', 'old-published']);
});

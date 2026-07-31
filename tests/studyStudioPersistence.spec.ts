import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('persistencia usa documento canonico e controle otimista de revisao', async () => {
  const service = await readFile('services/studyStudio/studyDocumentService.ts', 'utf8');
  const migration = await readFile(
    'supabase/migrations/20260728154254_secure_study_studio_documents_v2.sql',
    'utf8',
  );

  expect(service).toContain(".eq('revision', expectedRevision)");
  expect(service).toContain('StudyRevisionConflictError');
  expect(migration).toContain('add column if not exists document jsonb');
  expect(migration).toContain('status = \'published\' or auth.uid() = user_id');
  expect(migration).toContain('revoke all on table public.public_studies from anon');
});

test('editor oferece autosave e cinco modelos orientadores', async () => {
  const source = await readFile('views/CreateLandingPage.tsx', 'utf8');
  expect(source).toContain('useStudyAutosave');
  expect(source).toContain('Devocional guiado');
  expect(source).toContain('Esboco de mensagem');
  expect(source).toContain('Comecar em branco');
});

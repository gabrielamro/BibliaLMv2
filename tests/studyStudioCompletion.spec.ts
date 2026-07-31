import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('a IA gera proposta revisável sem aplicar silenciosamente', async () => {
  const editor = await readFile('views/CreateLandingPage.tsx', 'utf8');
  const review = await readFile('components/study-studio/AIProposalReview.tsx', 'utf8');

  expect(editor).toContain('setAIProposal({');
  expect(editor).toContain('<AIProposalReview');
  expect(editor).toContain("mode: 'replace-all' | 'merge' | 'append'");
  expect(review).toContain('Aplicar selecionados');
  expect(review).toContain('Aplicar como novos');
  expect(review).toContain('Aplicar tudo');
  expect(review).toContain('aria-modal="true"');
});

test('a biblioteca possui pesquisa, grupos e memória de recentes', async () => {
  const editor = await readFile('views/CreateLandingPage.tsx', 'utf8');
  expect(editor).toContain('id="study-block-search"');
  expect(editor).toContain('blockLibraryGroups');
  expect(editor).toContain('recentBlockTypes');
  expect(editor).toContain('aria-pressed={blockGroup === value}');
});

test('o comando de barra abre a biblioteca pelo teclado', async () => {
  const menu = await readFile('components/UnifiedEditor/components/EditorFloatingMenu.tsx', 'utf8');
  expect(menu).toContain("event.key !== '/'");
  expect(menu).toContain("event.key === 'Escape'");
  expect(menu).toContain('role="menu"');
  expect(menu).toContain('data-block-option');
});

test('salvar uma aula usa revisão otimista da sala', async () => {
  const room = await readFile('views/CreateRoomStudioPage.tsx', 'utf8');
  const service = await readFile('services/supabase.ts', 'utf8');
  expect(room).toContain('updateCustomPlanWithRevision');
  expect(room).toContain('nextPlan.revision = revision');
  expect(service).toContain(".eq('revision', expectedRevision)");
  expect(service).toContain("conflict.name = 'StudyRevisionConflictError'");
});

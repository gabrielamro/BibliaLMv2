import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('criar-sala protege o estúdio pastoral para visitantes', async ({ page }) => {
  await page.goto('/criar-sala', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Criar Sala/i })).toBeVisible();
  await expect(page.getByText(/plano pastoral ou igreja/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Entrar na Conta/i })).toBeVisible();
});

test('a edição de aula usa o componente canônico StudyStudio', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'views', 'CreateRoomStudioPage.tsx'),
    'utf8',
  );

  expect(source).toContain("import StudyStudio from '../components/study-studio/StudyStudio'");
  expect(source).toContain('<StudyStudio');
  expect(source).toContain('mode="roomLesson"');
  expect(source).not.toContain('<CreateContentV3Page');
});

test('as rotas legadas convergem para a rota canônica', async () => {
  const standalone = await readFile(
    path.join(process.cwd(), 'app', 'criar-conteudo', 'page.tsx'),
    'utf8',
  );
  const v3 = await readFile(
    path.join(process.cwd(), 'app', 'criar-conteudo-v3', 'page.tsx'),
    'utf8',
  );
  const v2 = await readFile(
    path.join(process.cwd(), 'app', 'criar-conteudo-v2', 'page.tsx'),
    'utf8',
  );

  expect(standalone).toContain('components/study-studio/StudyStudio');
  expect(standalone).toContain('mode="standalone"');
  expect(v3).toContain("redirect(`/criar-conteudo");
  expect(v2).toContain("redirect(`/criar-conteudo");
});

test('a estrutura da sala usa chave composta para aulas duplicadas em unidades distintas', async () => {
  const panel = await readFile(
    path.join(process.cwd(), 'components', 'PlanStudio', 'LessonStructurePanel.tsx'),
    'utf8',
  );
  const room = await readFile(
    path.join(process.cwd(), 'views', 'CreateRoomStudioPage.tsx'),
    'utf8',
  );

  expect(panel).toContain('const dragId = `${unitId}:${lesson.id}:${lessonIndex}`;');
  expect(panel).toContain('key={`${unit.id}:${lesson.id}:${lessonIndex}`}');
  expect(panel).toContain('`${unit.id}:${lesson.id}:${lessonIndex}`');
  expect(room).toContain('key={`${unitId}:${lesson.id}:${index}`}');
});

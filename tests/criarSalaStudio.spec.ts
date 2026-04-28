import { expect, test } from '@playwright/test';

test('criar-sala opens the new studio layout', async ({ page }) => {
  await page.goto('/criar-sala', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Criar sala/i })).toBeVisible();
  await expect(page.getByText('Dados essenciais', { exact: true })).toBeVisible();
  await expect(page.getByText('Estrutura da sala', { exact: true })).toBeVisible();
  await expect(page.getByText('Checklist da sala', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Nova aula/i })).toBeVisible();
});

test('criar-sala exposes evaluation as its own workspace section', async ({ page }) => {
  await page.goto('/criar-sala', { waitUntil: 'domcontentloaded' });

  await page.getByRole('tab', { name: /Avaliacao/i }).click();

  await expect(page.getByRole('heading', { name: /Avaliacao da sala/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Criar avaliacao/i })).toBeVisible();
  await expect(page.getByText(/Salve a sala antes de criar a avaliacao/i)).toBeVisible();
});

test('criar-sala lets users attach cover images and create lessons with the template editor in the same route', async ({ page }) => {
  await page.goto('/criar-sala', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: /Anexar imagem/i })).toBeVisible();

  await page.getByRole('button', { name: /Nova aula/i }).click();

  await expect(page).toHaveURL(/\/criar-sala\?lesson=/);
  await expect(page.getByText(/Template Estudo Profundo V3/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Concluir Aula/i })).toBeVisible();
});

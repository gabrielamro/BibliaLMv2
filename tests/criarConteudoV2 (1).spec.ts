import { expect, test } from '@playwright/test';

test('renders the create content v2 editorial experience', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Criar Conteudo V2' })).toBeVisible();
  await expect(page.getByText('Template editorial base')).toBeVisible();
  await expect(page.getByText('Roteiro do Estudo')).toBeVisible();
  await expect(page.getByText('Pergunta ao Coracao')).toBeVisible();
});

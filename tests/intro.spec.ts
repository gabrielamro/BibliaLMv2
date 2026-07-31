import { expect, test } from '@playwright/test';

test.describe('Apresentação do Culto+', () => {
  test('apresenta o ecossistema completo e as três visões do produto', async ({ page }) => {
    await page.goto('/intro');

    await expect(page).toHaveTitle(/Culto\+/);
    await expect(page.getByRole('heading', { level: 1, name: /Sua fé, sua comunidade e sua igreja/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Um ecossistema. Toda a vida da igreja.' })).toBeVisible();
    await expect(page.getByText('Minha visão', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Workspace Pastoral', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Gestão da Igreja', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Começar no Culto+' })).toHaveAttribute('href', '/login');
    await expect(page.getByText('BibliaLM', { exact: true })).toHaveCount(0);
  });

  test('mantém a página legível e sem rolagem horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/intro');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Viver minha jornada' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);
  });
});

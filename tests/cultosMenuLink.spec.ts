import { expect, test } from '@playwright/test';

test('o menu Cultos direciona para Meus Cultos', async ({ page }) => {
  await page.goto('/social');

  const cultosLink = page.getByRole('link', { name: 'Cultos', exact: true });
  await expect(cultosLink).toBeVisible({ timeout: 30_000 });
  await expect(cultosLink).toHaveAttribute('href', '/meus-cultos');
});

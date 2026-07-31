import { expect, test } from '@playwright/test';

test.describe('Estúdio da Palavra', () => {
  test('centraliza estrutura, blocos, modelos, Bíblia e IA no mesmo editor', async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 960 });
    await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('study-studio-shell')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Est.dio da Palavra/i).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Ferramentas do Est.dio/i })).toBeVisible();

    await page.getByRole('button', { name: 'Modelos' }).click();
    await expect(page.getByRole('heading', { name: /Modelos de estudo/i })).toBeVisible();

    await page.getByRole('button', { name: 'Bíblia', exact: true }).click();
    await expect(page.getByRole('heading', { name: /B.blia e refer.ncia/i })).toBeVisible();

    await page.getByRole('button', { name: 'Inserir', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Inserir bloco/i })).toBeVisible();
    await expect(page.getByText(/Hero Editorial/i).first()).toBeVisible();
    await expect(page.getByText('Obreiro IA', { exact: true }).first()).toBeVisible();
  });

  test('mantém o estúdio utilizável sem rolagem horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('study-studio-shell')).toBeVisible({ timeout: 20000 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));

    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole('button', { name: /Obreiro IA/i }).first()).toBeVisible();
  });

  test('preserva alterações locais e oferece recuperação após recarregar', async ({ page }) => {
    await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('study-studio-shell')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'Estrutura', exact: true }).click();
    const titleInput = page.getByLabel('Título');
    await titleInput.fill('Rascunho recuperável do Estúdio');
    await page.waitForTimeout(1200);

    const recoveryKey = await page.evaluate(() =>
      Object.keys(window.localStorage).find((key) => key.startsWith('cultoplus:study-studio:v2:')),
    );
    expect(recoveryKey).toBeTruthy();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('study-draft-recovery')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Recuperar' }).click();
    await page.getByRole('button', { name: 'Estrutura', exact: true }).click();
    await expect(page.getByLabel('Título')).toHaveValue('Rascunho recuperável do Estúdio');
  });
});

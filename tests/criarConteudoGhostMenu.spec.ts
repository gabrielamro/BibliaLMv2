import { expect, test } from '@playwright/test';

test('slot vazio abre as opções de bloco e o espaçador solicita o tamanho', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const firstBlock = page.getByTestId('sortable-block').first();
  await expect(firstBlock).toBeVisible({ timeout: 20000 });
  await firstBlock.click();
  await page.getByRole('button', { name: '1/2' }).first().click();

  const emptySlot = page.getByText('Slot Vazio').first();
  await expect(emptySlot).toBeVisible();
  await emptySlot.click();

  const ghostPicker = page.locator('[data-testid^="ghost-block-picker-"]').first();
  const spacerOption = ghostPicker.getByRole('button', { name: /Espaçador \/ Layout/i });
  await expect(spacerOption).toBeVisible();
  await spacerOption.click();

  await expect(ghostPicker.getByText(/Escolha o tamanho do espaçador/i)).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/3' })).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/2' })).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '2/3' })).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/1' })).toBeVisible();
});

test('a biblioteca Inserir adiciona um bloco ao mesmo editor', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const blocks = page.getByTestId('sortable-block');
  await expect(blocks.first()).toBeVisible({ timeout: 20000 });
  const previousCount = await blocks.count();
  await page.getByText('Editor de Texto', { exact: true }).first().click();
  await expect(blocks).toHaveCount(previousCount + 1);
});

test('slot vazio expõe a indicação visual de inserção', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const firstBlock = page.getByTestId('sortable-block').first();
  await expect(firstBlock).toBeVisible({ timeout: 20000 });
  await firstBlock.click();
  await page.getByRole('button', { name: '1/2' }).first().click();

  await expect(page.getByText('Slot Vazio').first()).toBeVisible();
  await expect(page.locator('[data-testid^="ghost-block-insertion-line-"]').first()).toHaveCount(1);
});
